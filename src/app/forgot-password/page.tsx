"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { authAPI } from '@/lib/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (value: string) => {
    setEmail(value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const validateEmail = (email: string) => {
    if (!email) {
      return 'Email is required';
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await authAPI.requestPasswordReset(email);
      setIsSuccess(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="login" />

      {/* Main Content */}
      <div className="py-16 px-6">
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

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#2A3262' }}>
              Reset Your Password
            </h1>
            <p className="text-gray-600">
              {"Enter your email address and we'll send you instructions to reset your password."}
            </p>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ABD305' }}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#2A3262' }}>
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {"If an account with that email exists, we've sent password reset instructions to"} <strong>{email}</strong>.
              </p>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  {"Didn't receive the email? Check your spam folder or "}
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail('');
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    try again
                  </button>
                </p>
                <Link 
                  href="/login"
                  className="inline-flex items-center justify-center w-full py-3 px-4 bg-white border-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#2A3262', color: '#2A3262' }}
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{error}</span>
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
                    value={email}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors ${
                      error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    style={{ backgroundColor: '#F8F9FA' }}
                    placeholder="Enter your email address"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2A3262' }}
              >
                {isSubmitting ? 'Sending Instructions...' : 'Send Reset Instructions'}
              </button>

              {/* Additional Help */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500 mb-2">
                  Remember your password?
                </p>
                <Link 
                  href="/login"
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#2A3262' }}
                >
                  Sign in here
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;