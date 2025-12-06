// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import AgoraRTC from 'agora-rtc-sdk-ng';
// import { useAuth } from '@/contexts/AuthContext';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { useVideo } from '@/contexts/VideoContext';
// import { registerAudioTrack, registerVideoTrack, registerInterval, forceStopAllMedia, clearAllResources } from '@/services/videoCleanupService';
// import { getAgoraToken, getRtcToken } from '@/api/videoApi';


// // Initialize Agora client
// const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// const VideoPage = () => {
//   const { user } = useAuth();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const state = location.state as any;
//   const { setActiveChannel, setIsInCall } = useVideo();

//   // Core state
//   const [localTracks, setLocalTracks] = useState([null, null]);
//   const [remoteUsers, setRemoteUsers] = useState([]);
//   const [joined, setJoined] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   // UI state
//   const [callDuration, setCallDuration] = useState(0);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [activeSpeakers, setActiveSpeakers] = useState(new Set());
//   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
//   const [notice, setNotice] = useState<string | null>(null);
//   const [connectionState, setConnectionState] = useState<string>(client.connectionState || 'DISCONNECTED');
  
//   // Connection config
//   const [config] = useState({
//     appId: state?.appId || import.meta.env.VITE_AGORA_APP_ID,
//     channel: state?.channelName || state?.roomId || 'test-channel',
//     token: state?.token || state?.rtcToken || null,
//     uid: user?.id ? String(user.id) : Math.floor(Math.random() * 100000)
//   });

//   // Refs
//   const localVideoRef = useRef(null);
//   const durationIntervalRef = useRef(null);
//   const mountedRef = useRef(true);
//   const fallbackAppliedRef = useRef(false);

//   // Register client for cleanup
//   useEffect(() => {
//     // registerClient(client); // Removed: no such export
//   }, []);
//   // Format time display
//   const formatTime = (seconds) => {
//     const hrs = Math.floor(seconds / 3600);
//     const mins = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;
    
//     if (hrs > 0) {
//       return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//     }
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   // Handle volume indicator for active speakers
//   const handleVolumeIndicator = useCallback((volumes) => {
//     const newActiveSpeakers = new Set();
//     volumes.forEach(volume => {
//       if (volume.level > 0.1) {
//         newActiveSpeakers.add(volume.uid);
//       }
//     });
//     setActiveSpeakers(newActiveSpeakers);
//   }, []);

//   // Join call
//   const joinCall = useCallback(async () => {
//     if (!mountedRef.current) return;
    
//     setIsLoading(true);
//     setError(null);
    
//     let audioTrack = null;
//     let videoTrack = null;

//     try {
//       console.log('[VideoPage] Starting call join...');
      
//       // Create local tracks
//       [audioTrack, videoTrack] = await Promise.all([
//         AgoraRTC.createMicrophoneAudioTrack().catch(e => {
//           console.warn('[VideoPage] Microphone error:', e);
//           return null;
//         }),
//         AgoraRTC.createCameraVideoTrack({
//           encoderConfig: {
//             width: 1280,
//             height: 720,
//             frameRate: 30,
//             bitrateMax: 1800,
//             bitrateMin: 1000
//           }
//         }).catch(e => {
//           console.warn('[VideoPage] Camera error:', e);
//           return null;
//         })
//       ]);

//       if (!mountedRef.current) {
//         audioTrack?.close();
//         videoTrack?.close();
//         return;
//       }

//       // Register tracks for cleanup
//       if (audioTrack) registerAudioTrack(audioTrack);
//       if (videoTrack) registerVideoTrack(videoTrack);

//       setLocalTracks([audioTrack, videoTrack]);

//       // Play local video
//       if (videoTrack && localVideoRef.current) {
//         videoTrack.play(localVideoRef.current);
//       }

//       // If we don't have a token in config and backend supports token generation,
//       // request one from the server using the roomId (if available).
//       if (!config.token) {
//         try {
//           const roomId = state?.roomId || state?.roomIdString || null;
//           if (roomId) {
//             console.log('[VideoPage] Fetching Agora token from backend for room:', roomId);
//             const tokenResponse = await getAgoraToken(roomId, String(config.uid));
//             if (tokenResponse && tokenResponse.rtcToken) {
//               config.token = tokenResponse.rtcToken;
//               // ensure appId/channel align with backend response when provided
//               if (tokenResponse.appId) config.appId = tokenResponse.appId;
//               if (tokenResponse.channelName) config.channel = tokenResponse.channelName;
//               console.log('[VideoPage] Obtained token from backend');
//             } else {
//               console.warn('[VideoPage] Backend did not return rtcToken');
//             }
//           } else {
//             // No roomId -> try generic RTC token endpoint (/api/agora/tokens/rtc)
//             try {
//               console.log('[VideoPage] No roomId available, requesting generic RTC token for channel:', config.channel);
//               const resp = await getRtcToken(config.channel, config.uid);
//               // AgoraTokenController returns { success, token, appId, expiresIn }
//               if (resp && resp.token) {
//                 config.token = resp.token;
//                 if (resp.appId) config.appId = resp.appId;
//                 console.log('[VideoPage] Obtained generic RTC token from backend');
//               } else if (resp && resp.data && resp.data.token) {
//                 // sometimes wrapped under data
//                 config.token = resp.data.token;
//                 if (resp.data.appId) config.appId = resp.data.appId;
//                 console.log('[VideoPage] Obtained generic RTC token from backend (data wrapper)');
//               } else {
//                 console.warn('[VideoPage] Generic RTC token endpoint did not return a token');
//               }
//             } catch (innerErr) {
//               console.warn('[VideoPage] Failed to fetch generic RTC token:', innerErr);
//             }
//           }
//         } catch (err) {
//           console.warn('[VideoPage] Failed to fetch token from backend:', err);
//         }
//       }

//       // Join channel (use token if available, otherwise null)
//       console.log('[VideoPage] Joining channel:', config.channel);
//       await client.join(config.appId, config.channel, config.token || null, config.uid);

//       // Publish tracks
//       const tracksToPublish = [audioTrack, videoTrack].filter(Boolean);
//       if (tracksToPublish.length > 0) {
//         await client.publish(tracksToPublish);
//         console.log('[VideoPage] Published tracks:', tracksToPublish.length);
//       }

//       // Enable volume indicator
//       client.enableAudioVolumeIndicator();
//       client.on('volume-indicator', handleVolumeIndicator);
//       // Listen for SDK warnings (bitrate/level warnings) and auto-fallback
//       const warningHandler = (warn) => {
//         try {
//           const code = warn?.code;
//           // Codes seen: 1003 SEND_VIDEO_BITRATE_TOO_LOW, 2001 AUDIO_INPUT_LEVEL_TOO_LOW, 2003 SEND_AUDIO_BITRATE_TOO_LOW
//           if (code === 1003 || code === 2003 || code === 2001) {
//             // progressive fallback: 0 = none, 1 = low applied, 2 = very-low applied
//             if (!fallbackAppliedRef.current) {
//               console.warn('[VideoPage] Agora warning received, applying low-quality fallback', warn);
//               setNotice('Network quality poor — switching to low-quality video');
//               fallbackAppliedRef.current = 1;
//               recreateCameraTrack('low').catch(e => console.warn('[VideoPage] fallback recreate failed', e));
//             } else if (fallbackAppliedRef.current === 1) {
//               console.warn('[VideoPage] Warning persisted after first fallback, applying very-low quality', warn);
//               setNotice('Network still poor — switching to very-low quality');
//               fallbackAppliedRef.current = 2;
//               recreateCameraTrack('very-low').catch(e => console.warn('[VideoPage] fallback recreate failed', e));
//             } else {
//               // already at lowest level; just inform user
//               setNotice('Network unstable — video quality at lowest setting');
//             }
//           }
//         } catch (e) {
//           console.warn('[VideoPage] warningHandler error', e);
//         }
//       };
//       client.on('warning', warningHandler);

//       // Listen for remote users
//       client.on('user-published', async (user, mediaType) => {
//         console.log('[VideoPage] User published:', user.uid, mediaType);
//         await client.subscribe(user, mediaType);
//         if (mountedRef.current) {
//           setRemoteUsers(prev => {
//             const exists = prev.find(u => u.uid === user.uid);
//             if (exists) return prev;
//             return [...prev, user];
//           });
//         }
//       });

//       client.on('user-unpublished', (user) => {
//         console.log('[VideoPage] User unpublished:', user.uid);
//         setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
//       });

//       client.on('user-left', (user) => {
//         console.log('[VideoPage] User left:', user.uid);
//         setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
//       });

//       // cleanup for warning handler on leave/unmount
//       const cleanupWarning = () => {
//         try { client.off('warning', warningHandler); } catch (e) {}
//       };

//       setJoined(true);
//       setIsInCall(true);
//       setActiveChannel(config.channel);
      
//       // Start duration timer
//       const intervalId = setInterval(() => {
//         setCallDuration(prev => prev + 1);
//       }, 1000);
//       durationIntervalRef.current = intervalId;
//       registerInterval(intervalId);

//       console.log('[VideoPage] Call joined successfully');
//   // ensure warning cleanup will run on leave
//   // note: leaveCall will call client.leave which should disconnect, but keep a local cleanup
//   // we attach it to mountedRef so unmount can run it as well
//   // (we don't need to store cleanupWarning ref; it's a closure)

//     } catch (err) {
//       console.error('[VideoPage] Error joining call:', err);
//       setError(err.message || 'Failed to join call');
      
//       // NOTE: don't aggressively stop/close local tracks here. The join can
//       // fail for network/credential reasons (e.g. invalid App ID / token) and
//       // immediately closing tracks prevents the user from retrying without
//       // re-granting camera/microphone permissions. Leave tracks open so the
//       // user can hit Retry. The aggressive cleanup will run on unmount/leave.
//       // If you prefer to fully release devices on join failure, uncomment the
//       // block below.
//       /*
//       [audioTrack, videoTrack].forEach(track => {
//         try {
//           track?.stop();
//           track?.close();
//         } catch (e) {}
//       });
//       setLocalTracks([null, null]);
//       */
//     } finally {
//       setIsLoading(false);
//     }
//   }, [config, handleVolumeIndicator, setActiveChannel, setIsInCall]);

//   // Leave call with aggressive cleanup
//   const leaveCall = useCallback(async () => {
//     try {
//       console.log('[VideoPage] Starting call leave...');
      
//       // Stop timer
//       if (durationIntervalRef.current) {
//         clearInterval(durationIntervalRef.current);
//       }

//       // Disable tracks first
//       localTracks.forEach(track => {
//         try {
//           if (track && typeof track.setEnabled === 'function') {
//             track.setEnabled(false);
//           }
//         } catch (e) {
//           console.warn('[VideoPage] Error disabling track:', e);
//         }
//       });

//       // Leave channel
//       if (client.connectionState === 'CONNECTED') {
//         try {
//           const tracksToUnpublish = localTracks.filter(Boolean);
//           if (tracksToUnpublish.length > 0) {
//             await client.unpublish(tracksToUnpublish);
//           }
//           client.off('volume-indicator', handleVolumeIndicator);
//           await client.leave();
//           console.log('[VideoPage] Left channel successfully');
//         } catch (e) {
//           console.warn('[VideoPage] Error leaving:', e);
//         }
//       }

//       // Force stop all media using cleanup service
//       await forceStopAllMedia();

//       // Reset state
//       setLocalTracks([null, null]);
//       setRemoteUsers([]);
//       setJoined(false);
//       setCallDuration(0);
//       setIsMicOn(true);
//       setIsCameraOn(true);
//       setIsInCall(false);
//       setActiveChannel(null);
      
//       console.log('[VideoPage] Call ended and cleaned up');
      
//       // Navigate back
//       navigate(-1);
      
//     } catch (err) {
//       console.error('[VideoPage] Error leaving call:', err);
//       // Still try to cleanup even if there's an error
//       await clearAllResources();
//       setIsInCall(false);
//       setActiveChannel(null);
//       navigate(-1);
//     }
//   }, [localTracks, handleVolumeIndicator, navigate, setActiveChannel, setIsInCall]);

//   // Toggle microphone
//   const toggleMic = useCallback(async () => {
//     const [audioTrack] = localTracks;
//     if (!audioTrack) {
//       setNotice('No microphone available');
//       return;
//     }
//     try {
//       const newState = !isMicOn;
//       await audioTrack.setEnabled(newState);
//       setIsMicOn(newState);
//       console.log('[VideoPage] Mic toggled:', newState);
//     } catch (err) {
//       console.error('[VideoPage] Error toggling mic:', err);
//       setNotice('Failed to toggle microphone');
//     }
//   }, [localTracks]);

//   // Toggle camera
//   const toggleCamera = useCallback(async () => {
//     const [, videoTrack] = localTracks;
//     if (!videoTrack) {
//       setNotice('No camera available');
//       return;
//     }
//     try {
//       const newState = !isCameraOn;
//       await videoTrack.setEnabled(newState);
//       setIsCameraOn(newState);
//       console.log('[VideoPage] Camera toggled:', newState);
//     } catch (err) {
//       console.error('[VideoPage] Error toggling camera:', err);
//       setNotice('Failed to toggle camera');
//     }
//   }, [localTracks, isCameraOn]);

//   // Recreate camera track (level can be boolean or string: true|'low' => low, false|'high' => high, 'very-low' => very low)
//   const recreateCameraTrack = useCallback(async (level: any) => {
//     const [, oldVideoTrack] = localTracks;
//     try {
//       // Stop & close old track if present
//       if (oldVideoTrack) {
//         try {
//           oldVideoTrack.stop?.();
//         } catch (e) {}
//         try {
//           oldVideoTrack.close?.();
//         } catch (e) {}
//       }

//       // Create new camera track with requested encoder settings
//       // Accept boolean lowQuality or string levels
//       let encoderConfig: any;
//       const lvl = (typeof level === 'boolean') ? (level ? 'low' : 'high') : (typeof level === 'string' ? level : 'high');
//       if (lvl === 'very-low' || lvl === 'vlow') {
//         encoderConfig = { width: 320, height: 180, frameRate: 10, bitrateMax: 150, bitrateMin: 100 };
//       } else if (lvl === 'low') {
//         encoderConfig = { width: 640, height: 360, frameRate: 15, bitrateMax: 600, bitrateMin: 200 };
//       } else {
//         encoderConfig = { width: 1280, height: 720, frameRate: 30, bitrateMax: 1800, bitrateMin: 1000 };
//       }

//       const newVideoTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig }).catch(e => {
//         console.warn('[VideoPage] Failed to create camera track:', e);
//         return null;
//       });

//       if (!newVideoTrack) {
//         setNotice('Unable to access camera for new track');
//         return;
//       }

//       // Register for cleanup and set state
//       registerVideoTrack(newVideoTrack);
//       setLocalTracks(prev => [prev[0], newVideoTrack]);
//       setIsCameraOn(true);

//       // Play it immediately if ref is present
//       if (localVideoRef.current) {
//         try {
//           newVideoTrack.play(localVideoRef.current);
//         } catch (e) {
//           console.warn('[VideoPage] Failed to play new video track:', e);
//         }
//       }

//       // If already joined, publish the new track (unpublish old one first)
//       if (client.connectionState === 'CONNECTED') {
//         try {
//           // Unpublish old track if any
//           if (oldVideoTrack) await client.unpublish([oldVideoTrack]).catch(() => {});
//           await client.publish([newVideoTrack]);
//           console.log('[VideoPage] Re-published new camera track');
//         } catch (e) {
//           console.warn('[VideoPage] Error publishing new camera track:', e);
//         }
//       }
//     } catch (err) {
//       console.error('[VideoPage] recreateCameraTrack error:', err);
//       setNotice('Failed to recreate camera track');
//     }
//   }, [localTracks]);

//   // Play remote videos
//   useEffect(() => {
//     remoteUsers.forEach(user => {
//       if (user.videoTrack) {
//         const container = document.getElementById(`remote-${user.uid}`);
//         if (container) {
//           user.videoTrack.play(container);
//         }
//       }
//     });
//   }, [remoteUsers]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       mountedRef.current = false;
//       console.log('[VideoPage] Component unmounting, cleaning up...');
      
//       // Aggressive cleanup
//       if (durationIntervalRef.current) {
//         clearInterval(durationIntervalRef.current);
//       }
      
//       localTracks.forEach(track => {
//         try {
//           track?.stop();
//           track?.close();
//         } catch (e) {}
//       });
      
//       if (client.connectionState === 'CONNECTED') {
//         client.leave().catch(e => console.warn('[VideoPage] Error on unmount leave:', e));
//       }
      
//       forceStopAllMedia().catch(e => console.warn('[VideoPage] Error on force cleanup:', e));
//     };
//   }, [localTracks]);

//   // Error state
//   if (error && !joined) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
//         <div className="text-center max-w-md mx-auto px-6">
//           <div className="w-24 h-24 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center backdrop-blur-xl border border-red-500/20">
//             <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//             </svg>
//           </div>
//           <h2 className="text-3xl font-light mb-4">{error}</h2>
//           <p className="text-gray-400 mb-8 text-sm leading-relaxed">
//             Please check your camera and microphone permissions, then try again.
//           </p>
//           <div className="flex gap-3 justify-center">
//             <button
//               onClick={joinCall}
//               className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
//             >
//               Retry
//             </button>
//             <button
//               onClick={() => navigate(-1)}
//               className="px-10 py-4 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-all"
//             >
//               Back
//             </button>
//           </div>
//         </div>
//       </div>
      
//     );
//   }

//   // Pre-call state
//   if (!joined && !isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
//         <div className="text-center max-w-xl mx-auto px-6">
//           <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center backdrop-blur-xl border border-blue-500/30 shadow-2xl">
//             <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
//             </svg>
//           </div>
//           <h1 className="text-5xl font-light mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
//             Ready to Connect
//           </h1>
//           <p className="text-gray-400 mb-4 text-lg">
//             Join the video call and start collaborating
//           </p>
//           <p className="text-gray-500 mb-12 text-sm">
//             Channel: <span className="text-blue-400 font-medium">{config.channel}</span>
//           </p>
//           <button
//             onClick={joinCall}
//             className="px-12 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 text-lg"
//           >
//             Join Call
//           </button>
//           {/* Connection state indicator */}
//           <div className="ml-3 flex items-center gap-3">
//             <div className={`text-xs px-3 py-1 rounded-full bg-black/50 border border-white/10 text-gray-200`}>Conn: {connectionState}</div>
//             {notice && (
//               <div className="text-xs px-3 py-1 rounded-full bg-yellow-600/90 text-white">{notice}</div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
//         <div className="text-center">
//           <div className="w-20 h-20 mx-auto mb-6 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
//           <p className="text-2xl font-light text-gray-300">Joining call...</p>
//           <p className="text-sm text-gray-500 mt-2">Setting up your audio and video</p>
//         </div>
//       </div>
//     );
//   }

//   // Main video call UI
//   const totalParticipants = remoteUsers.length + 1;
//   const gridClass = totalParticipants === 1 ? 'grid-cols-1' :
//                     totalParticipants === 2 ? 'grid-cols-2' :
//                     totalParticipants <= 4 ? 'grid-cols-2' :
//                     totalParticipants <= 6 ? 'grid-cols-3' :
//                     'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

//   return (
//     <div className="relative flex flex-col w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
//       {/* Animated background */}
//       <div className="absolute inset-0 opacity-30">
//         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse"></div>
//         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
//       </div>

//       {/* Header */}
//       <div className="relative z-10 p-6">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-6">
//             <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl rounded-full px-5 py-3 border border-white/10">
//               <div className={`w-3 h-3 rounded-full ${joined ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
//               <span className="text-sm font-medium text-gray-200">
//                 {formatTime(callDuration)}
//               </span>
//             </div>
//             <div className="text-sm font-light text-gray-400 bg-white/5 backdrop-blur-xl rounded-full px-5 py-3 border border-white/10">
//               <span className="font-semibold text-white">{totalParticipants}</span> {totalParticipants === 1 ? 'participant' : 'participants'}
//             </div>
//           </div>
          
//           <button
//             onClick={() => setIsSettingsOpen(!isSettingsOpen)}
//             className="p-3 bg-white/5 backdrop-blur-xl rounded-full hover:bg-white/10 transition-all border border-white/10"
//             title="Settings"
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//             </svg>
//           </button>
//           {/* Settings panel (moved into main header for consistent access) */}
//           {isSettingsOpen && (
//             <div className="absolute top-20 right-8 z-30 p-4 bg-black/70 border border-white/10 rounded-lg shadow-lg backdrop-blur">
//               <div className="text-sm text-gray-200 mb-2">Video Settings</div>
//               <div className="flex flex-col gap-2">
//                 <button
//                   onClick={() => recreateCameraTrack(true)}
//                   className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm"
//                 >
//                   Use lower quality (640x360)
//                 </button>
//                 <button
//                   onClick={() => recreateCameraTrack(false)}
//                   className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm"
//                 >
//                   Restore quality (1280x720)
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Video Grid */}
//       <div className="relative flex-1 px-6 pb-32 overflow-auto">
//         <div className={`h-full grid gap-4 ${gridClass}`}>
//           {/* Local Video */}
//           <div className="relative rounded-3xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl overflow-hidden border border-white/10 shadow-2xl group">
//             <div
//               ref={localVideoRef}
//               className="w-full h-full flex items-center justify-center"
//             >
//               {!isCameraOn && (
//                 <div className="text-center">
//                   <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
//                     <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                     </svg>
//                   </div>
//                   <p className="text-gray-400 text-sm font-light">Camera off</p>
//                 </div>
//               )}
//             </div>

//             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
//             <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
//               <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20">
//                 <span className="text-sm font-medium">{user?.name || 'You'}</span>
//                 {activeSpeakers.has(config.uid) && (
//                   <div className="flex gap-1">
//                     <span className="w-1 h-3 bg-green-500 rounded-full animate-pulse"></span>
//                     <span className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
//                     <span className="w-1 h-3 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
//                   </div>
//                 )}
//               </div>
//               <div className="flex gap-2">
//                 {!isMicOn && (
//                   <div className="w-8 h-8 bg-red-500/90 backdrop-blur-xl rounded-full flex items-center justify-center border border-red-400/50">
//                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
//                     </svg>
//                   </div>
//                 )}
//                 {!isCameraOn && (
//                   <div className="w-8 h-8 bg-red-500/90 backdrop-blur-xl rounded-full flex items-center justify-center border border-red-400/50">
//                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a2 2 0 00-2.828-1.828L13 6.586V5a2 2 0 00-2-2H6.828L3.707 2.293z" clipRule="evenodd" />
//                     </svg>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Remote Videos */}
//           {remoteUsers.map((user) => (
//             <div
//               key={user.uid}
//               className="relative rounded-3xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl overflow-hidden border border-white/10 shadow-2xl group"
//             >
//               <div
//                 id={`remote-${user.uid}`}
//                 className="w-full h-full flex items-center justify-center"
//               >
//                 {!user.videoTrack && (
//                   <div className="text-center">
//                     <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full flex items-center justify-center border border-purple-500/30">
//                       <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                       </svg>
//                     </div>
//                     <p className="text-gray-400 text-sm font-light">Camera off</p>
//                   </div>
//                 )}
//               </div>

//               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
//               <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
//                 <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20">
//                   <span className="text-sm font-medium">User {user.uid}</span>
//                   {activeSpeakers.has(user.uid) && (
//                     <div className="flex gap-1">
//                       <span className="w-1 h-3 bg-green-500 rounded-full animate-pulse"></span>
//                       <span className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
//                       <span className="w-1 h-3 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
//                     </div>
//                   )}
//                 </div>
//                 {!user.audioTrack && (
//                   <div className="w-8 h-8 bg-red-500/90 backdrop-blur-xl rounded-full flex items-center justify-center border border-red-400/50">
//                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
//                     </svg>
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Controls Bar */}
//       <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-center z-20">
//         <div className="bg-white/10 backdrop-blur-2xl rounded-full shadow-2xl flex items-center gap-4 px-8 py-4 border border-white/20">
//           {/* Microphone */}
//           <button
//             onClick={toggleMic}
//             className={`w-14 h-14 rounded-full transition-all transform hover:scale-110 ${
//               isMicOn
//                 ? 'bg-white/20 hover:bg-white/30'
//                 : 'bg-red-500 hover:bg-red-600'
//             }`}
//             title={isMicOn ? 'Mute' : 'Unmute'}
//           >
//             <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
//               {isMicOn ? (
//                 <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
//               ) : (
//                 <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
//               )}
//             </svg>
//           </button>

//           {/* Camera */}
//           <button
//             onClick={toggleCamera}
//             className={`w-14 h-14 rounded-full transition-all transform hover:scale-110 ${
//               isCameraOn
//                 ? 'bg-white/20 hover:bg-white/30'
//                 : 'bg-red-500 hover:bg-red-600'
//             }`}
//             title={isCameraOn ? 'Stop Video' : 'Start Video'}
//           >
//             <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
//               {isCameraOn ? (
//                 <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
//               ) : (
//                 <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a2 2 0 00-2.828-1.828L13 6.586V5a2 2 0 00-2-2H6.828L3.707 2.293z" clipRule="evenodd" />
//               )}
//             </svg>
//           </button>

//           {/* End Call */}
//           <button
//             onClick={leaveCall}
//             className="w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-110 shadow-lg"
//             title="End Call"
//           >
//             <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
//               <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
//             </svg>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoPage;