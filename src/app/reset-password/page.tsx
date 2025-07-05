"use client"

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Cookies from 'js-cookie';

// Separate component that uses useSearchParams
const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    token: '',
    password: '',
    passwordConfirmation: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Extract token from URL on component mount
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setTokenError('Invalid reset link. Please request a new password reset.');
      return;
    }
    setFormData(prev => ({ ...prev, token }));
  }, [searchParams]);

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
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Password confirmation is required';
    } else if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { strength: 'weak', color: '#ef4444', text: 'Too short' };
    if (password.length < 8) return { strength: 'fair', color: '#f59e0b', text: 'Fair' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 'strong', color: '#10b981', text: 'Strong' };
    }
    return { strength: 'good', color: '#3b82f6', text: 'Good' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await authAPI.confirmPasswordReset(
        formData.token,
        formData.password,
        formData.passwordConfirmation
      );

      // Store token and user data (auto-login after successful reset)
      Cookies.set('auth_token', response.data.token, { expires: 7 });
      Cookies.set('user_data', JSON.stringify(response.data.user), { expires: 7 });
      
      // Update auth context
      updateUser(response.data.user);
      
      setIsSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      
      // Check if it's a token error
      if (errorMessage.includes('invalid') || errorMessage.includes('expired')) {
        setTokenError(errorMessage);
      } else {
        setErrors({ submit: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show token error state
  if (tokenError) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#2A3262' }}>
          Invalid Reset Link
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          {tokenError}
        </p>
        <div className="space-y-3">
          <Link 
            href="/forgot-password"
            className="block w-full py-3 px-4 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2A3262' }}
          >
            Request New Reset Link
          </Link>
          <Link 
            href="/login"
            className="block w-full py-3 px-4 bg-white border-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#2A3262', color: '#2A3262' }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      {/* Back to Login Link */}
      <div className="mb-6">
        <Link 
          href="/login"
          className="inline-flex items-center gap-2 text-sm hover:underline"
          style={{ color: '#2A3262' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>

      {/* Success State */}
      {isSuccess ? (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ABD305' }}>
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#2A3262' }}>
            Password Reset Successful!
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Your password has been updated successfully. You are now logged in and will be redirected to your dashboard.
          </p>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#2A3262' }}></div>
            <span className="ml-2 text-sm text-gray-500">Redirecting...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#2A3262' }}>
              Set New Password
            </h1>
            <p className="text-gray-600">
              Choose a strong password for your account.
            </p>
          </div>

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submit Error */}
            {errors.submit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">{errors.submit}</span>
              </div>
            )}

            {/* New Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2A3262' }}>
                New Password
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
                  placeholder="Enter new password (minimum 6 characters)"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        backgroundColor: passwordStrength.color,
                        width: passwordStrength.strength === 'weak' ? '25%' : 
                               passwordStrength.strength === 'fair' ? '50%' :
                               passwordStrength.strength === 'good' ? '75%' : '100%'
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2A3262' }}>
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPasswordConfirmation ? "text" : "password"}
                  value={formData.passwordConfirmation}
                  onChange={(e) => handleInputChange('passwordConfirmation', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors ${
                    errors.passwordConfirmation ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  style={{ backgroundColor: '#F8F9FA' }}
                  placeholder="Confirm your new password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswordConfirmation ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.passwordConfirmation && (
                <p className="mt-1 text-sm text-red-600">{errors.passwordConfirmation}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${formData.password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  At least 6 characters long
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${formData.password === formData.passwordConfirmation && formData.password ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Passwords match
                </li>
              </ul>
            </div>

            {/* Reset Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#2A3262' }}
            >
              {isSubmitting ? 'Updating Password...' : 'Update Password'}
            </button>

            {/* Security Notice */}
            <div className="text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                {"After updating your password, you'll be automatically logged in to your account."}
              </p>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

// Loading fallback component
const LoadingFallback = () => (
  <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading reset form...</p>
    </div>
  </div>
);

// Main component with Suspense boundary
const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="login" />

      {/* Main Content */}
      <div className="py-16 px-6">
        <Suspense fallback={<LoadingFallback />}>
          <ResetPasswordForm />
        </Suspense>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;