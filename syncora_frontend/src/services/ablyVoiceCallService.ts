import * as Ably from 'ably';
import axios from '@/lib/axios';

interface VoiceCallState {
  ablyClient: Ably.Realtime | null;
  channel: Ably.RealtimeChannel | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isConnected: boolean;
}

const state: VoiceCallState = {
  ablyClient: null,
  channel: null,
  localStream: null,
  remoteStreams: new Map(),
  isConnected: false,
};

/**
 * WebRTC peer connections for each remote user
 */
const peerConnections: Map<string, RTCPeerConnection> = new Map();

/**
 * Buffer ICE candidates received before the remote description is set.
 * Keyed by remote clientId.
 */
const candidateBuffers: Map<string, RTCIceCandidateInit[]> = new Map();

/**
 * ICE servers configuration for WebRTC
 */
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * Initialize Ably client with token for voice calls
 */
export async function initializeAblyVoiceClient(clientId: string, channelName: string): Promise<Ably.Realtime> {
  try {
    // Request token from backend with specific channel name for proper capabilities
    const response = await axios.post('/ably/tokens/voice', {
      channelName: channelName,
    });

    const { token } = response.data;

    // authCallback will request a fresh token from backend using the same channelName.
    state.ablyClient = new Ably.Realtime({
      authCallback: (tokenParams: any, cb: any) => {
        // tokenParams may be provided by Ably; we ignore and request server-side token for channel
        axios.post('/ably/tokens/voice', { channelName })
          .then(resp => {
            const tokenResp = resp.data;
            if (tokenResp && tokenResp.token) {
              cb(null, tokenResp.token);
            } else {
              cb(new Error('Invalid token response from server'));
            }
          })
          .catch(err => {
            console.error('[AblyVoice] authCallback failed to fetch token:', err);
            cb(err);
          });
      },
      clientId,
    });

    return state.ablyClient;
  } catch (error) {
    console.error('[AblyVoice] Failed to initialize client:', error);
    throw error;
  }
}

/**
 * Create a voice call client and join a channel
 */
export async function createVoiceClient(
  channelName: string,
  clientId: string
): Promise<{ client: Ably.Realtime; channel: Ably.RealtimeChannel }> {
  try {
    console.log('[AblyVoice] Creating voice client for channel:', channelName);

    // Initialize Ably client with channel-specific token
    const client = await initializeAblyVoiceClient(clientId, channelName);

    // Get channel
    const channel = client.channels.get(channelName);

    // Subscribe to channel presence
    await channel.presence.subscribe('enter', (presenceMsg) => {
      console.log('[AblyVoice] User joined:', presenceMsg.clientId);
      handleUserJoined(presenceMsg.clientId!);
    });

    await channel.presence.subscribe('leave', (presenceMsg) => {
      console.log('[AblyVoice] User left:', presenceMsg.clientId);
      handleUserLeft(presenceMsg.clientId!);
    });

    // Subscribe to WebRTC signaling messages
    await channel.subscribe('webrtc-offer', handleOffer);
    await channel.subscribe('webrtc-answer', handleAnswer);
    await channel.subscribe('webrtc-ice-candidate', handleIceCandidate);

    // Enter presence
    await channel.presence.enter();

    state.channel = channel;
    state.isConnected = true;

    console.log('[AblyVoice] Successfully joined channel:', channelName);

    return { client, channel };
  } catch (error) {
    console.error('[AblyVoice] Failed to create voice client:', error);
    throw error;
  }
}

/**
 * Join a voice channel and start audio
 */
export async function joinVoiceChannel(
  channelName: string,
  clientId: string
): Promise<MediaStream> {
  try {
    console.log('[AblyVoice] Joining voice channel:', channelName);

    // Create client and channel
    await createVoiceClient(channelName, clientId);

    // Get local audio stream
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    state.localStream = localStream;

    console.log('[AblyVoice] Local audio stream obtained');

    // Get existing participants and create peer connections
    if (state.channel) {
      const members = await state.channel.presence.get();
      for (const member of members) {
        if (member.clientId && member.clientId !== clientId) {
          await createPeerConnection(member.clientId, true);
        }
      }
    }

    return localStream;
  } catch (error) {
    console.error('[AblyVoice] Failed to join voice channel:', error);
    throw error;
  }
}

/**
 * Create a WebRTC peer connection for a remote user
 */
async function createPeerConnection(
  remoteClientId: string,
  isOfferer: boolean
): Promise<RTCPeerConnection> {
  try {
    console.log('[AblyVoice] Creating peer connection with:', remoteClientId);

    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, state.localStream!);
      });
    }

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      console.log('[AblyVoice] Received remote track from:', remoteClientId);
      const remoteStream = event.streams[0];
      state.remoteStreams.set(remoteClientId, remoteStream);

      // Notify UI of new remote stream
      window.dispatchEvent(
        new CustomEvent('ably-remote-stream-added', {
          detail: { clientId: remoteClientId, stream: remoteStream },
        })
      );
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && state.channel) {
        state.channel.publish('webrtc-ice-candidate', {
          candidate: event.candidate,
          targetClientId: remoteClientId,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('[AblyVoice] Connection state:', peerConnection.connectionState);
    };

    peerConnections.set(remoteClientId, peerConnection);

    // If we're the offerer, decide deterministically whether to actually create an offer.
    if (isOfferer) {
      try {
        const localClientId = state.ablyClient?.auth?.clientId || '';

        // Deterministic tie-breaker: only the peer with the lexicographically smaller clientId will be the offerer.
        // This prevents both sides from creating offers at the same time (glare).
        if (localClientId && remoteClientId && localClientId >= remoteClientId) {
          console.log('[AblyVoice] Deterministic glare: skipping offer creation (localClientId >= remoteClientId)', localClientId, remoteClientId);
        } else {
          // Only create an offer if there's no remote description and the signalling state is stable.
          const remoteDesc = peerConnection.remoteDescription;
          if (!remoteDesc && peerConnection.signalingState === 'stable') {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            if (state.channel) {
              await state.channel.publish('webrtc-offer', {
                offer,
                targetClientId: remoteClientId,
              });
            }
          } else {
            console.log('[AblyVoice] Skipping offer creation; remote offer already present or signallingState=', peerConnection.signalingState);
          }
        }
      } catch (error) {
        console.error('[AblyVoice] Error creating offer:', error);
        throw error;
      }
    }

    return peerConnection;
  } catch (error) {
    console.error('[AblyVoice] Failed to create peer connection:', error);
    throw error;
  }
}

/**
 * Handle incoming WebRTC offer
 */
async function handleOffer(message: any) {
  try {
    const { offer, targetClientId } = message.data;

    // Only handle offers intended for us
    if (targetClientId !== state.ablyClient?.auth.clientId) return;

    const senderClientId = message.clientId!;
    console.log('[AblyVoice] Received offer from:', senderClientId);

    // Create peer connection if it doesn't exist
    let peerConnection = peerConnections.get(senderClientId);
    if (!peerConnection) {
      peerConnection = await createPeerConnection(senderClientId, false);
    }

    // Prevent duplicate/contradictory signalling operations (glare)
    const remoteDesc = peerConnection.remoteDescription;
    if (peerConnection.signalingState === 'have-local-offer') {
      console.warn('[AblyVoice] Received remote offer but we already have a local offer - skipping to avoid glare');
      return;
    }

    // If remote description is not already set (or not an offer), handle it
    if (!remoteDesc || remoteDesc.type !== 'offer') {
        // Set remote description
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        // Flush any buffered ICE candidates for this peer now that remote description is set
        const buffered = candidateBuffers.get(senderClientId) || [];
        for (const cand of buffered) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
          } catch (err) {
            console.warn('[AblyVoice] Ignoring buffered ICE candidate error:', err);
          }
        }
        candidateBuffers.delete(senderClientId);

        // Create and send answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        if (state.channel) {
          await state.channel.publish('webrtc-answer', {
            answer,
            targetClientId: senderClientId,
          });
        }
    } else {
      console.log('[AblyVoice] Remote offer already set; skipping duplicate offer handling');
    }
  } catch (error) {
    console.error('[AblyVoice] Failed to handle offer:', error);
  }
}

/**
 * Handle incoming WebRTC answer
 */
async function handleAnswer(message: any) {
  try {
    const { answer, targetClientId } = message.data;

    // Only handle answers intended for us
    if (targetClientId !== state.ablyClient?.auth.clientId) return;

    const senderClientId = message.clientId!;
    console.log('[AblyVoice] Received answer from:', senderClientId);

    const peerConnection = peerConnections.get(senderClientId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

      // Flush any buffered ICE candidates now that remote description is set
      const buffered = candidateBuffers.get(senderClientId) || [];
      for (const cand of buffered) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn('[AblyVoice] Ignoring buffered ICE candidate error after answer:', err);
        }
      }
      candidateBuffers.delete(senderClientId);
    }
  } catch (error) {
    console.error('[AblyVoice] Failed to handle answer:', error);
  }
}

/**
 * Handle incoming ICE candidate
 */
async function handleIceCandidate(message: any) {
  try {
    const { candidate, targetClientId } = message.data;

    // Only handle candidates intended for us
    if (targetClientId !== state.ablyClient?.auth.clientId) return;

    const senderClientId = message.clientId!;
    const peerConnection = peerConnections.get(senderClientId);

    if (!candidate) return;

    if (peerConnection) {
      try {
        // Only add if remote description is set; otherwise buffer the candidate
        if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Buffer candidate until remote description is applied
          const buf = candidateBuffers.get(senderClientId) || [];
          buf.push(candidate);
          candidateBuffers.set(senderClientId, buf);
          console.log('[AblyVoice] Buffered ICE candidate for', senderClientId);
        }
      } catch (err) {
        console.error('[AblyVoice] Failed to handle ICE candidate:', err);
      }
    } else {
      const buf = candidateBuffers.get(senderClientId) || [];
      buf.push(candidate);
      candidateBuffers.set(senderClientId, buf);
      console.log('[AblyVoice] Buffered ICE candidate (no PC) for', senderClientId);
    }
  } catch (error) {
    console.error('[AblyVoice] Failed to handle ICE candidate:', error);
  }
}

/**
 * Handle user joined event
 */
async function handleUserJoined(clientId: string) {
  try {
    // Skip if it's our own client
    if (clientId === state.ablyClient?.auth.clientId) return;

    console.log('[AblyVoice] New user joined, creating peer connection:', clientId);

    // We're the offerer for new joiners
    await createPeerConnection(clientId, true);
  } catch (error) {
    console.error('[AblyVoice] Failed to handle user joined:', error);
  }
}

/**
 * Handle user left event
 */
function handleUserLeft(clientId: string) {
  try {
    console.log('[AblyVoice] User left:', clientId);

    // Close peer connection
    const peerConnection = peerConnections.get(clientId);
    if (peerConnection) {
      peerConnection.close();
      peerConnections.delete(clientId);
    }

    // Remove remote stream
    state.remoteStreams.delete(clientId);

    // Notify UI
    window.dispatchEvent(
      new CustomEvent('ably-remote-stream-removed', {
        detail: { clientId },
      })
    );
  } catch (error) {
    console.error('[AblyVoice] Failed to handle user left:', error);
  }
}

/**
 * Leave voice channel and cleanup
 */
export async function leaveVoiceChannel(): Promise<void> {
  try {
    console.log('[AblyVoice] Leaving voice channel');

    // Stop local stream
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
      state.localStream = null;
    }

    // Close all peer connections
    peerConnections.forEach((pc) => pc.close());
    peerConnections.clear();

    // Leave presence and detach from channel
    if (state.channel) {
      await state.channel.presence.leave();
      state.channel.detach();
      state.channel = null;
    }

    // Close Ably client
    if (state.ablyClient) {
      state.ablyClient.close();
      state.ablyClient = null;
    }

    state.remoteStreams.clear();
    state.isConnected = false;

    console.log('[AblyVoice] Successfully left voice channel');
  } catch (error) {
    console.error('[AblyVoice] Failed to leave voice channel:', error);
    throw error;
  }
}

/**
 * Mute/unmute local audio
 */
export function toggleMute(mute: boolean): void {
  if (state.localStream) {
    state.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !mute;
    });
    console.log('[AblyVoice] Audio muted:', mute);
  }
}

/**
 * Get current voice call state
 */
export function getVoiceCallState(): VoiceCallState {
  return state;
}

/**
 * Get remote streams
 */
export function getRemoteStreams(): Map<string, MediaStream> {
  return state.remoteStreams;
}
