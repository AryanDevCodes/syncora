// interfaces.ts

export interface VideoTokenResponse {
  success?: boolean;
  token?: string;
  rtcToken?: string;
  appId?: string;
  channelName?: string;
  expiresIn?: number;
  data?: {
    token?: string;
    appId?: string;
  };
}

export interface VideoApiTokenResp {
  rtcToken?: string;
  appId?: string;
  channelName?: string;
  expiresAt?: string | number;
}

export interface AuthUser {
  id: string | number;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface RemoteUserModel {
  uid: string | number;
  audioTrack?: any;
  videoTrack?: any;
  metadata?: {
    name?: string;
    avatar?: string;
  };
}
