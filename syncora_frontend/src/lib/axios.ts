import axios from 'axios';

// Normalize VITE_API_URL so it does not include a trailing `/api` segment.
// This prevents accidental duplication when code calls endpoints like `/api/...`.
const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:8080';
// Remove any trailing slashes and an ending `/api` if present
const API_BASE_ROOT = rawApi.replace(/\/+$/g, '').replace(/\/api$/i, '');
// Use the normalized root and append '/api' so client code can call endpoints
// using paths like '/users/me' or '/api/...'. This keeps behavior predictable.
const API_BASE = `${API_BASE_ROOT}/api`;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Suppress console errors for expected 400/404 on getUserByEmail (contacts not registered)
    if (
      (error.response?.status === 400 || error.response?.status === 404) &&
      originalRequest?.url?.includes('/users/by-email')
    ) {
      // Silently pass through - caller will handle
      return Promise.reject(error);
    }

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            // No refresh token, logout -> add diagnostic log so we know which request caused this
            console.warn('[axios] 401 with no refreshToken on', originalRequest?.url, 'response:', error.response?.status, error.response?.data);
            // No refresh token, logout
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userEmail');
            window.location.href = '/auth';
            return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

        // Store new tokens
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, log and logout
        console.warn('[axios] token refresh failed for', originalRequest?.url, 'status:', refreshError.response?.status, 'data:', refreshError.response?.data, 'error:', refreshError.message);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userEmail');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;