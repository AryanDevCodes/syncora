const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
const API_BASE = BASE_URL.replace(/\/+$/g, '').replace(/\/api$/i, '') + '/api';

export const getUserByEmail = async (email: string) => {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(`${API_BASE}/users/by-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    // Silently handle 400/404 - user not found (expected for unregistered contacts)
    if (response.status === 400 || response.status === 404) {
      throw new Error('User not found');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error: any) {
    // Expected error for contacts who haven't registered yet
    throw error;
  }
};
