import axios from "axios";
import axiosInstance from "@/lib/axios";


const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface JwtResponse {
  token: string;
  expiration: number;
  refreshToken: string;

}

export interface UserDto {
  id?: number;
  userId?: string;
  email?: string;
  userEmail?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Login user and get JWT tokens
 */
export const loginUser = async (credentials: LoginRequest): Promise<JwtResponse> => {
  try {
    const response = await axios.post<ApiResponse<JwtResponse>>(
      `${API_BASE}/auth/login`,
      credentials
    );
    console.log('🔐 Login response received:', response.data);
    const jwtData = response.data.data;
    console.log('🔐 JWT Response data:', jwtData);

    return jwtData;
  } catch (error: any) {
    console.error('❌ Login API error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Register new user
 */
export const registerUser = async (userData: SignupRequest): Promise<void> => {
  await axios.post<ApiResponse<void>>(`${API_BASE}/auth/signup`, userData);
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (token: string): Promise<UserDto> => {
  const response = await axiosInstance.get<ApiResponse<UserDto>>(`/users/me`);
  return response.data.data;
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<JwtResponse> => {
  // Use direct axios for refresh to avoid interceptor loop
  const response = await axios.post<ApiResponse<JwtResponse>>(
    `${API_BASE}/auth/refresh`,
    { refreshToken }
  );
  return response.data.data;
};

/**
 * Logout user and revoke refresh token
 */
export const logoutUser = async (refreshToken: string): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(`/auth/logout`, { refreshToken });
};