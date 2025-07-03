"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { User, AuthResponse, LoginData, RegisterData } from '@/lib/types';
import { authAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const login = async (credentials: LoginData) => {
    try {
      const response: AuthResponse = await authAPI.login(credentials);
      
      // Store token and user data
      Cookies.set('auth_token', response.data.token, { expires: 7 }); // 7 days
      Cookies.set('user_data', JSON.stringify(response.data.user), { expires: 7 });
      
      setUser(response.data.user);
    } catch (loginError: unknown) {
      const errorMessage = loginError instanceof Error ? loginError.message : 'Login failed';
      throw new Error(errorMessage);
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
    // Redirect to login page
    window.location.href = '/login';
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    Cookies.set('user_data', JSON.stringify(userData), { expires: 7 });
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
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