/**
 * Get Ably token for chat or voice
 * @param type - "chat" or "voice"
 * @param channelName - Optional channel name for voice calls
 */
export const getAblyToken = async (
  type: "chat" | "voice",
  channelName?: string
) => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
  // Normalize base URL to avoid duplicated `/api` segments (like when VITE_API_URL already ends with /api)
  const normalizedBase = baseURL.replace(/\/+$/g, '').replace(/\/api$/i, '');
  const endpoint = type === "chat" ? "/chat" : "/voice";
  const body = type === "voice" && channelName ? { channelName } : {};
  const url = `${normalizedBase}/api/ably/tokens${endpoint}`;

  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token error: ${res.status} ${text}`);
  }

  const data = await res.json();

  if (!data.success || !data.token) {
    throw new Error("Token API failed: " + JSON.stringify(data));
  }

  return data.token;
};
