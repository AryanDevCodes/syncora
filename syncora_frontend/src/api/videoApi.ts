import axiosInstance from '@/lib/axios';

/* -------------------------------------------------------------
   Agora Token API — FIXED & CLEAN
-------------------------------------------------------------- */

const RTC_TOKEN_ENDPOINT = '/agora/tokens/rtc';
const BASE_URL = '/video';

/* ---------- UTIL HELPERS ---------- */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Convert email → safe Agora Account ID
 * Matches backend TokenUtils.normalizeUserAccount()
 */
export const toAgoraAccount = (input?: string | number): string => {
  if (!input) {
    return "web" + Math.floor(10000 + Math.random() * 90000);
  }

  if (typeof input === "number") {
    return "web" + input;
  }

  // Strip invalid chars & lowercase
  let cleaned = input
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

  if (!cleaned) {
    cleaned = "user" + Math.floor(10000 + Math.random() * 90000);
  }

  return "web" + cleaned;
};

/** Unified extractor (backend returns: { success, token, appId, expiresIn }) */
const extract = (raw: any) => {
  return raw?.token ?? raw?.rtcToken ?? raw?.accessToken ?? null;
};

/* -------------------------------------------------------------
   ALWAYS SEND ACCOUNT (Web SDK requirement)
-------------------------------------------------------------- */
export const getRtcToken = async (
  channelName: string,
  uidOrEmail?: string | number,
  retries = 2
) => {

  const account = toAgoraAccount(uidOrEmail);

  const payload = {
    channelName,
    account,
    role: "ROLE_PUBLISHER"
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log("[videoApi] Requesting RTC Token:", { payload, attempt });

      const resp = await axiosInstance.post(RTC_TOKEN_ENDPOINT, payload);

      const raw = resp.data ?? {};
      const token = extract(raw);

      return {
        success: true,
        token,
        appId: raw?.appId,
        expiresIn: raw?.expiresIn ?? 3600,
        account,
        raw
      };

    } catch (err: any) {
      const status = err?.response?.status;
      const lastTry = attempt === retries;

      console.error(`[videoApi] token attempt ${attempt} failed:`, err?.message);

      // retry only server-side failures
      if (!lastTry && (!status || [502, 503, 504].includes(status))) {
        await sleep(300 * (attempt + 1));
        continue;
      }

      throw err;
    }
  }

  throw new Error("Failed to fetch RTC token after retries");
};

/* -------------------------------------------------------------
   VIDEO ROOM REST API
-------------------------------------------------------------- */

export const createVideoRoom = async (request: any) => {
  const resp = await axiosInstance.post(`${BASE_URL}/create`, request);
  return resp.data?.data ?? resp.data;
};

export const startVideoCall = async (chatRoomId: string, roomName?: string, rec = false) => {
  const resp = await axiosInstance.post(`${BASE_URL}/start/${chatRoomId}`, null, {
    params: { roomName, recordingEnabled: rec }
  });
  return resp.data?.data ?? resp.data;
};

export const joinVideoRoom = async (roomId: string, email: string) => {
  const resp = await axiosInstance.post(`${BASE_URL}/${roomId}/join`, null, {
    params: { email }
  });
  return resp.data?.data ?? resp.data;
};

export const leaveVideoRoom = async (roomId: string, email: string) => {
  const resp = await axiosInstance.post(`${BASE_URL}/${roomId}/leave`, null, {
    params: { email }
  });
  return resp.data?.data ?? resp.data;
};

export const endVideoCall = async (roomId: string) => {
  await axiosInstance.patch(`${BASE_URL}/${roomId}/end`);
};

export const getVideoHistory = async (chatRoomId: string) => {
  const resp = await axiosInstance.get(`${BASE_URL}/chat/${chatRoomId}/history`);
  return resp.data?.data ?? resp.data ?? [];
};

export const getActiveVideoRooms = async (chatRoomId: string) => {
  const resp = await axiosInstance.get(`${BASE_URL}/chat/${chatRoomId}`);
  return resp.data?.data ?? resp.data ?? [];
};

export const getEndedVideoSessions = async (chatRoomId: string) => {
  const resp = await axiosInstance.get(`${BASE_URL}/chat/${chatRoomId}/ended`);
  return resp.data?.data ?? resp.data ?? [];
};

/* ------------------------------------------------------------- */

export const videoApi = {
  getRtcToken,
  createVideoRoom,
  startVideoCall,
  joinVideoRoom,
  leaveVideoRoom,
  endVideoCall,
  getVideoHistory,
  getActiveVideoRooms,
  getEndedVideoSessions,
};

export default videoApi;
