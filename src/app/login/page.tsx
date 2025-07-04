"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import GoogleSignInButton from '@/components/GoogleSignInButton';

const LoginPage = () => {
  const router = useRouter();
  const { 
    login, 
    requiresGoogleAuth, 
    googleAuthMessage, 
    clearGoogleAuthState 
  } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await login(formData);
      router.push('/'); // Redirect to homepage after successful login
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = () => {
    router.push('/'); // Redirect to homepage after successful Google login
  };

  const handleGoogleError = (error: string) => {
    setErrors({ submit: error });
  };

  const handleBackToEmailLogin = () => {
    clearGoogleAuthState();
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="login" />

      {/* Login Form Section */}
      <div className="py-16 px-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#2A3262' }}>
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to continue your learning journey</p>
          </div>

          {/* Cross-Authentication Message */}
          {requiresGoogleAuth && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-800 mb-1">Google Sign-In Required</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    {googleAuthMessage || 'This account is linked with Google. Please use Google Sign-In to continue.'}
                  </p>
                  <GoogleSignInButton 
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                  />
                  <button
                    type="button"
                    onClick={handleBackToEmailLogin}
                    className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Try different email
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Login Form - Hidden when Google auth required */}
          {!requiresGoogleAuth && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Submit Error */}
              {errors.submit && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{errors.submit}</span>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2A3262' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors ${
                      errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    style={{ backgroundColor: '#F8F9FA' }}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2A3262' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors ${
                      errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    style={{ backgroundColor: '#F8F9FA' }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link 
                  href="/forgot-password" 
                  className="text-sm hover:underline"
                  style={{ color: '#2A3262' }}
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2A3262' }}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Login Button */}
              <GoogleSignInButton 
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />

              {/* Register Link */}
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link 
                    href="/register" 
                    className="font-medium hover:underline"
                    style={{ color: '#2A3262' }}
                  >
                    Sign up here
                  </Link>
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;