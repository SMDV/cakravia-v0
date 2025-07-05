import { apiClient } from './client';
import { AuthResponse, RegisterData, LoginData, User, ApiResponse, GoogleAuthResponse, CrossAuthResponse } from '../types';
import Cookies from 'js-cookie';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
  auth_required?: string; // For cross-authentication scenarios
}

// NEW: Password reset types
interface PasswordResetResponse {
  data: {
    message: string;
  };
  status: string;
  error: boolean;
}

interface PasswordResetConfirmResponse {
  data: {
    message: string;
    token: string;
    user: User;
  };
  status: string;
  error: boolean;
}

interface PasswordChangeResponse {
  data: {
    message: string;
  };
  status: string;
  error: boolean;
}

export const authAPI = {
  // Register new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      console.log('🔄 Registering user with data:', userData);
      
      // API expects { user: userData } format
      const response = await apiClient.post('/users/register', {
        user: userData
      });
      
      console.log('✅ Registration response:', response.data);
      
      // Transform the response to match our expected format
      // API returns: { token: "...", user: {...} }
      // We need: { data: { token: "...", user: {...} } }
      return {
        data: {
          token: response.data.token,
          user: response.data.user
        },
        status: 'success',
        error: false
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      // Extract error message from API response
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else if (axiosError.response?.data?.errors) {
        // Handle validation errors
        const errors = axiosError.response.data.errors;
        const firstError = Object.values(errors)[0] as string[];
        throw new Error(firstError[0] || 'Registration failed');
      } else if (axiosError.response?.status === 422) {
        throw new Error('Invalid registration data. Please check your information.');
      } else if (axiosError.message) {
        throw new Error(axiosError.message);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  },

  // Enhanced login method with Google cross-authentication support
  login: async (credentials: LoginData): Promise<CrossAuthResponse> => {
    try {
      console.log('🔄 Logging in user with credentials:', { email: credentials.email });
      
      const response = await apiClient.post('/users/login', credentials);
      
      console.log('✅ Login response:', response.data);
      
      const token = response.data.token;
      
      // Fetch user profile using the token
      console.log('🔄 Fetching user profile...');
      const profileResponse = await apiClient.get('/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Profile response:', profileResponse.data);
      
      return {
        success: true,
        token: token,
        user: profileResponse.data.data
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      // Handle cross-authentication scenario
      if (axiosError.response?.status === 403 && 
          axiosError.response?.data?.auth_required === 'google') {
        return {
          success: false,
          requiresGoogleAuth: true,
          message: axiosError.response.data.message || 
                  'This account requires Google Sign-In. Please use Google to continue.'
        };
      }
      
      // Handle other errors
      if (axiosError.response?.data?.message) {
        return {
          success: false,
          error: axiosError.response.data.message
        };
      } else if (axiosError.response?.status === 401) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      } else if (axiosError.response?.status === 422) {
        return {
          success: false,
          error: 'Please check your credentials'
        };
      } else if (axiosError.message) {
        return {
          success: false,
          error: axiosError.message
        };
      } else {
        return {
          success: false,
          error: 'Login failed. Please try again.'
        };
      }
    }
  },

  // NEW: Google authentication method
  googleLogin: async (idToken: string): Promise<GoogleAuthResponse> => {
    try {
      console.log('🔄 Authenticating with Google...');
      
      const response = await apiClient.post('/users/google_login', {
        id_token: idToken
      });
      
      console.log('✅ Google login response:', response.data);
      
      // Backend should return both token and user data for Google login
      // Expected format: { data: { token: "...", user: {...} } }
      return {
        data: {
          token: response.data.data.token,
          user: response.data.data.user
        },
        status: 'success',
        error: false
      };
    } catch (error) {
      console.error('❌ Google login error:', error);
      
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else if (axiosError.response?.status === 401) {
        throw new Error('Google authentication failed. Please try again.');
      } else if (axiosError.response?.status === 422) {
        throw new Error('Invalid Google token. Please try signing in again.');
      } else if (axiosError.message) {
        throw new Error(axiosError.message);
      } else {
        throw new Error('Google authentication failed. Please try again.');
      }
    }
  },

  // NEW: Request password reset
  requestPasswordReset: async (email: string): Promise<PasswordResetResponse> => {
    try {
      console.log('🔄 Requesting password reset for:', email);
      
      const response = await apiClient.post('/users/password_reset', { email });
      
      console.log('✅ Password reset request response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Password reset request error:', error);
      
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      if (axiosError.response?.data?.errors) {
        // Handle validation errors
        const errors = axiosError.response.data.errors;
        const firstError = Object.values(errors)[0] as string[];
        throw new Error(firstError[0] || 'Invalid email address');
      } else if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else if (axiosError.response?.status === 422) {
        throw new Error('Please enter a valid email address.');
      } else if (axiosError.message) {
        throw new Error(axiosError.message);
      } else {
        throw new Error('Failed to send reset email. Please try again.');
      }
    }
  },

  // NEW: Confirm password reset
  confirmPasswordReset: async (
    token: string, 
    password: string, 
    passwordConfirmation: string
  ): Promise<PasswordResetConfirmResponse> => {
    try {
      console.log('🔄 Confirming password reset with token');
      
      const response = await apiClient.post('/users/password_reset_confirm', {
        token,
        password,
        password_confirmation: passwordConfirmation
      });
      
      console.log('✅ Password reset confirm response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Password reset confirm error:', error);
      
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      if (axiosError.response?.data?.errors) {
        // Handle validation errors
        const errors = axiosError.response.data.errors;
        
        // Check for specific error types
        if (errors.token) {
          throw new Error('Reset link is invalid or expired. Please request a new one.');
        } else if (errors.password) {
          throw new Error(errors.password[0] || 'Password is invalid');
        } else if (errors.password_confirmation) {
          throw new Error(errors.password_confirmation[0] || 'Passwords do not match');
        } else {
          const firstError = Object.values(errors)[0] as string[];
          throw new Error(firstError[0] || 'Password reset failed');
        }
      } else if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else if (axiosError.response?.status === 422) {
        throw new Error('Invalid reset data. Please check your information.');
      } else if (axiosError.message) {
        throw new Error(axiosError.message);
      } else {
        throw new Error('Password reset failed. Please try again.');
      }
    }
  },

  // NEW: Change password for authenticated users
  changePassword: async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ): Promise<PasswordChangeResponse> => {
    try {
      console.log('🔄 Changing password for authenticated user');
      
      const response = await apiClient.patch('/users/password_change', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation
      });
      
      console.log('✅ Password change response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Password change error:', error);
      
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      if (axiosError.response?.data?.errors) {
        // Handle validation errors
        const errors = axiosError.response.data.errors;
        
        // Check for specific error types
        if (errors.current_password) {
          throw new Error('Current password is incorrect');
        } else if (errors.new_password) {
          throw new Error(errors.new_password[0] || 'New password is invalid');
        } else if (errors.new_password_confirmation) {
          throw new Error(errors.new_password_confirmation[0] || 'New passwords do not match');
        } else {
          const firstError = Object.values(errors)[0] as string[];
          throw new Error(firstError[0] || 'Password change failed');
        }
      } else if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else if (axiosError.response?.status === 401) {
        throw new Error('Please log in again to change your password');
      } else if (axiosError.response?.status === 422) {
        throw new Error('Invalid password data. Please check your information.');
      } else if (axiosError.message) {
        throw new Error(axiosError.message);
      } else {
        throw new Error('Password change failed. Please try again.');
      }
    }
  },

  // Get user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await apiClient.get('/users/profile');
      console.log('✅ Profile response:', response.data);
      return response.data; // API returns { data: user, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Profile fetch error:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData: FormData): Promise<ApiResponse<User>> => {
    try {
      const response = await apiClient.put('/users', profileData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Profile update response:', response.data);
      return response.data; // API returns { data: user, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Profile update failed');
      }
    }
  },

  // Logout (client-side only for now)
  logout: () => {
    console.log('🚪 Logging out user');
    // Remove tokens from cookies
    Cookies.remove('auth_token');
    Cookies.remove('user_data');
  },

  // Test API connection
  testConnection: async () => {
    try {
      // Test with login endpoint since there's no health endpoint
      const response = await fetch('https://api.cakravia.com/api/v1/users/login', {
        method: 'OPTIONS'
      });
      console.log('✅ API connection test:', response.status);
      return true;
    } catch (error) {
      console.error('❌ API connection failed:', error);
      return false;
    }
  }
};