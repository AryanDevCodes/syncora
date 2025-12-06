import axios from '@/lib/axios';

export interface VideoCallHistory {
  id: string;
  userId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  planAtCallTime: string;
  timeLimitSeconds: number | null;
  wasLimitReached: boolean;
  createdAt: string;
}

export interface SaveCallHistoryRequest {
  roomId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  wasLimitReached?: boolean;
}

export interface CallStats {
  totalSecondsThisWeek: number;
  totalMinutesThisWeek: number;
  totalHoursThisWeek: string;
}

export const saveCallHistory = async (request: SaveCallHistoryRequest): Promise<VideoCallHistory> => {
  const response = await axios.post('/video/history', request);
  return response.data;
};

export const getCallHistory = async (): Promise<VideoCallHistory[]> => {
  const response = await axios.get('/video/history');
  return response.data;
};

export const getCallStats = async (): Promise<CallStats> => {
  const response = await axios.get('/video/history/stats');
  return response.data;
};
