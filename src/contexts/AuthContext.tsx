"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { User, AuthResponse, LoginData, RegisterData, GoogleAuthResponse, CrossAuthResponse, ConfigData } from '@/lib/types';
import { authAPI } from '@/lib/api';
import { configAPI } from '@/lib/api/config';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>; // NEW
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  // Cross-authentication state
  requiresGoogleAuth: boolean; // NEW
  googleAuthMessage: string; // NEW
  clearGoogleAuthState: () => void; // NEW
  // Config state
  config: ConfigData | null;
  configLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // NEW: Cross-authentication state
  const [requiresGoogleAuth, setRequiresGoogleAuth] = useState(false);
  const [googleAuthMessage, setGoogleAuthMessage] = useState('');
  // Config state
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Fetch config on mount (doesn't require authentication)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await configAPI.getConfig();
        setConfig(response.data);
      } catch (error) {
        console.error('Failed to fetch config:', error);
        // Set default fallback pricing if API fails
        setConfig({
          pricing: {
            vark_price: 30000,
            ai_knowledge_price: 35000,
            behavioral_learning_price: 40000,
            comprehensive_assessment_price: 45000,
            tpa_price: 50000,
          },
          tpa: {
            score_levels: {
              low: { name: 'Kategori Rendah', min_score: 200, max_score: 449, label: 'Kategori Rendah', message: 'Performa rendah' },
              average: { name: 'Kategori Rata-Rata', min_score: 450, max_score: 549, label: 'Kategori Rata-Rata', message: 'Performa rata-rata' },
              high: { name: 'Kategori Tinggi', min_score: 550, max_score: 800, label: 'Kategori Tinggi', message: 'Performa tinggi' },
            },
          },
        });
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = Cookies.get('auth_token');
        if (token) {
          // Try to get user profile with existing token
          const response = await authAPI.getProfile();
          setUser(response.data);
        }
      } catch (authError) {
        // Token might be expired, remove it
        console.error('Auth check failed:', authError);
        Cookies.remove('auth_token');
        Cookies.remove('user_data');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Enhanced login with cross-authentication support
  const login = async (credentials: LoginData) => {
    try {
      // Clear any previous Google auth state
      setRequiresGoogleAuth(false);
      setGoogleAuthMessage('');
      
      const response: CrossAuthResponse = await authAPI.login(credentials);
      
      if (response.success && response.token && response.user) {
        // Store token and user data
        Cookies.set('auth_token', response.token, { expires: 7 }); // 7 days
        Cookies.set('user_data', JSON.stringify(response.user), { expires: 7 });
        
        setUser(response.user);
      } else if (response.requiresGoogleAuth) {
        // Handle cross-authentication scenario
        setRequiresGoogleAuth(true);
        setGoogleAuthMessage(response.message || 'This account requires Google Sign-In.');
        throw new Error(response.message || 'Please use Google Sign-In to continue.');
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (loginError: unknown) {
      const errorMessage = loginError instanceof Error ? loginError.message : 'Login failed';
      throw new Error(errorMessage);
    }
  };

  // NEW: Google authentication
  const googleLogin = async (idToken: string) => {
    try {
      setIsLoading(true);
      // Clear any previous auth state
      setRequiresGoogleAuth(false);
      setGoogleAuthMessage('');
      
      const response: GoogleAuthResponse = await authAPI.googleLogin(idToken);
      
      // Store token and user data
      Cookies.set('auth_token', response.data.token, { expires: 7 }); // 7 days
      Cookies.set('user_data', JSON.stringify(response.data.user), { expires: 7 });
      
      setUser(response.data.user);
      
      // Show success message if account was linked
      if (response.message) {
        console.log('✅ Google Auth Success:', response.message);
        // You could show a toast notification here
      }
    } catch (googleError: unknown) {
      const errorMessage = googleError instanceof Error ? googleError.message : 'Google authentication failed';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response: AuthResponse = await authAPI.register(userData);
      
      // Store token and user data
      Cookies.set('auth_token', response.data.token, { expires: 7 });
      Cookies.set('user_data', JSON.stringify(response.data.user), { expires: 7 });
      
      setUser(response.data.user);
    } catch (registerError: unknown) {
      const errorMessage = registerError instanceof Error ? registerError.message : 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    // Clear Google auth state
    setRequiresGoogleAuth(false);
    setGoogleAuthMessage('');
    // Redirect to login page
    window.location.href = '/login';
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    Cookies.set('user_data', JSON.stringify(userData), { expires: 7 });
  };

  // NEW: Clear Google auth state
  const clearGoogleAuthState = () => {
    setRequiresGoogleAuth(false);
    setGoogleAuthMessage('');
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    googleLogin, // NEW
    register,
    logout,
    updateUser,
    // NEW: Cross-authentication state
    requiresGoogleAuth,
    googleAuthMessage,
    clearGoogleAuthState,
    // Config state
    config,
    configLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};