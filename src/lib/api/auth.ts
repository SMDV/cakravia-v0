import { apiClient } from './client';
import { AuthResponse, RegisterData, LoginData, User, ApiResponse } from '../types';

export const authAPI = {
  // Register new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/users/register', {
      user: userData
    });
    return response.data;
  },

  // Login user
  login: async (credentials: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('/users/login', credentials);
    return response.data;
  },

  // Get user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData: FormData): Promise<ApiResponse<User>> => {
    const response = await apiClient.put('/users', profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Logout (client-side only for now)
  logout: () => {
    // Remove tokens from cookies
    const Cookies = require('js-cookie');
    Cookies.remove('auth_token');
    Cookies.remove('user_data');
  },
};