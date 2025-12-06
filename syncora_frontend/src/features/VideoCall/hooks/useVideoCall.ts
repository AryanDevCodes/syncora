// src/features/VideoCall/hooks/useVideoCall.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgoraRTC, {
    IAgoraRTCClient,
    IMicrophoneAudioTrack,
    ICameraVideoTrack,
    UID
} from "agora-rtc-sdk-ng";

import { getAgoraToken } from "@/utils/tokenUtils";
import { useAuth } from "@/contexts/AuthContext";

type UseVideoCallOpts = {
    channel?: string;
    email?: string; // use email → converted to Agora account
    autoJoin?: boolean;
};

export const useVideoCall = (opts: UseVideoCallOpts = {}) => {
    const appId = import.meta.env.VITE_AGORA_APP_ID as string;
    const channel = opts.channel ?? "test-channel";
    const email = opts.email ?? "guest@example.com";

    const autoJoin = opts.autoJoin ?? true;

    const { agoraUserAccount } = useAuth();

    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const audioRef = useRef<IMicrophoneAudioTrack | null>(null);
    const videoRef = useRef<ICameraVideoTrack | null>(null);

    const tokenRef = useRef<string | null>(null);
    const accountRef = useRef<string>(agoraUserAccount || "guest");

    const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
    const [isJoined, setIsJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);
    const [connectionState, setConnectionState] = useState<string>("DISCONNECTED");
    const [isLoading, setIsLoading] = useState(false);

    /* ----------------------------------------------------
       Initialize Agora Client (one time)
    ---------------------------------------------------- */
    useEffect(() => {
        if (clientRef.current) return;

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
            try {
                await client.subscribe(user, mediaType);
                setRemoteUsers((prev) => {
                    const exists = prev.find((p) => p.uid === user.uid);
                    if (exists) return prev.map((p) => (p.uid === user.uid ? user : p));
                    return [...prev, user];
                });
            } catch (e) {
                console.warn("subscribe error:", e);
            }
        });

        client.on("user-unpublished", (user) => {
            setRemoteUsers((prev) => prev.filter((p) => p.uid !== user.uid));
        });

        client.on("user-left", (user) => {
            setRemoteUsers((prev) => prev.filter((p) => p.uid !== user.uid));
        });

        client.on("connection-state-change", (cur) => {
            setConnectionState(cur);
        });

        return () => {
            clientRef.current = null;
        };
    }, []);

    /* ----------------------------------------------------
       Create Local Tracks
    ---------------------------------------------------- */
    const createLocalTracks = useCallback(async () => {
        try {
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            audioRef.current = audioTrack;

            let videoTrack: ICameraVideoTrack | null = null;
            try {
                videoTrack = await AgoraRTC.createCameraVideoTrack({
                    encoderConfig: { width: 1280, height: 720, frameRate: 24 },
                });
            } catch {
                // fallback if camera selection fails
                const devices = await navigator.mediaDevices.enumerateDevices();
                const cam = devices.find((d) => d.kind === "videoinput");
                if (cam) {
                    videoTrack = await AgoraRTC.createCameraVideoTrack({
                        cameraId: cam.deviceId,
                    });
                }
            }
            videoRef.current = videoTrack;
        } catch (err) {
            console.warn("local track error:", err);
        }
    }, []);

    /* ----------------------------------------------------
       Get Agora Token (account-based)
    ---------------------------------------------------- */
    const fetchToken = useCallback(async () => {
        if (tokenRef.current) return tokenRef.current;

        tokenRef.current = await getAgoraToken(channel, accountRef.current, "rtc");

        return tokenRef.current;
    }, [channel]);

    /* ----------------------------------------------------
       Join Channel
    ---------------------------------------------------- */
    const join = useCallback(async () => {
        if (!clientRef.current || isJoined) return;

        setIsLoading(true);
        try {
            const token = await fetchToken();
            if (!token) throw new Error("Token missing (account-based)");

            await clientRef.current.join(
                appId,
                channel,
                token,
                accountRef.current // account-based UID substitute
            );

            setIsJoined(true);
        } catch (e) {
            console.warn("Join failed:", e);
        } finally {
            setIsLoading(false);
        }
    }, [appId, channel, fetchToken, isJoined]);

    /* ----------------------------------------------------
       Publish local tracks
    ---------------------------------------------------- */
    const publish = useCallback(async () => {
        if (!clientRef.current) return;
        const tracks = [];
        if (audioRef.current) tracks.push(audioRef.current);
        if (videoRef.current) tracks.push(videoRef.current);

        if (tracks.length > 0) {
            try {
                await clientRef.current.publish(tracks);
            } catch (err) {
                console.warn("publish error:", err);
            }
        }
    }, []);

    /* ----------------------------------------------------
       Leave channel
    ---------------------------------------------------- */
    const leave = useCallback(async () => {
        if (!clientRef.current) return;

        try {
            if (audioRef.current) {
                audioRef.current.stop();
                audioRef.current.close();
            }
            if (videoRef.current) {
                videoRef.current.stop();
                videoRef.current.close();
            }

            await clientRef.current.leave();
        } catch { }

        setIsJoined(false);
        setRemoteUsers([]);
        tokenRef.current = null;
    }, []);

    /* ----------------------------------------------------
       Toggle mic & camera
    ---------------------------------------------------- */
    const toggleMute = useCallback(() => {
        if (!audioRef.current) return;
        const next = !audioRef.current.enabled;
        audioRef.current.setEnabled(next);
        setIsMuted(!next);
    }, []);

    const toggleCamera = useCallback(() => {
        if (!videoRef.current) return;
        const next = !videoRef.current.enabled;
        videoRef.current.setEnabled(next);
        setCamOff(!next);
    }, []);

    /* ----------------------------------------------------
       Auto-Join on mount
    ---------------------------------------------------- */
    const hasJoinedOnce = useRef(false);

    useEffect(() => {
        if (!autoJoin) return;
        if (hasJoinedOnce.current) return; // prevents double-run
        hasJoinedOnce.current = true;

        let active = true;

        (async () => {
            await createLocalTracks();
            if (!active) return;

            await join();
            if (!active) return;

            await publish();
        })();

        return () => {
            active = false;
        };
    }, []);

    /* ----------------------------------------------------
       Hook return object
    ---------------------------------------------------- */
    return useMemo(
        () => ({
            client: clientRef.current,
            isJoined,
            isLoading,
            remoteUsers,
            connectionState,
            localAudioTrack: audioRef.current,
            localVideoTrack: videoRef.current,

            join,
            leave,
            publish,
            toggleMute,
            toggleCamera,

            isMuted,
            camOff,
        }),
        [
            isJoined,
            isLoading,
            remoteUsers,
            connectionState,
            toggleMute,
            toggleCamera,
            camOff,
            isMuted,
        ]
    );
};

export default useVideoCall;
