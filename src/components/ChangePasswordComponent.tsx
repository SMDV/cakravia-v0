"use client"

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { authAPI } from '@/lib/api';

interface ChangePasswordComponentProps {
  className?: string;
}

const ChangePasswordComponent: React.FC<ChangePasswordComponentProps> = ({ className = '' }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirmation: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirmation: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    
    // Clear success message when user starts editing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirmation') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    if (!formData.newPasswordConfirmation) {
      newErrors.newPasswordConfirmation = 'Password confirmation is required';
    } else if (formData.newPassword !== formData.newPasswordConfirmation) {
      newErrors.newPasswordConfirmation = 'New passwords do not match';
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

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await authAPI.changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.newPasswordConfirmation
      );
      
      // Success - clear form and show success message
      setFormData({
        currentPassword: '',
        newPassword: '',
        newPasswordConfirmation: ''
      });
      setSuccessMessage('Password changed successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#2A3262' }}
        >
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#2A3262' }}>
            Change Password
          </h3>
          <p className="text-sm text-gray-600">
            Update your password to keep your account secure.
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600">{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Submit Error */}
        {errors.submit && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">{errors.submit}</span>
          </div>
        )}

        {/* Current Password Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2A3262' }}>
            Current Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors ${
                errors.currentPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              style={{ backgroundColor: '#F8F9FA' }}
              placeholder="Enter your current password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
          )}
        </div>

        {/* New Password Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2A3262' }}>
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPasswords.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors ${
                errors.newPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              style={{ backgroundColor: '#F8F9FA' }}
              placeholder="Enter new password (minimum 6 characters)"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {formData.newPassword && (
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
          
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
          )}
        </div>

        {/* Confirm New Password Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2A3262' }}>
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPasswords.confirmation ? "text" : "password"}
              value={formData.newPasswordConfirmation}
              onChange={(e) => handleInputChange('newPasswordConfirmation', e.target.value)}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors ${
                errors.newPasswordConfirmation ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              style={{ backgroundColor: '#F8F9FA' }}
              placeholder="Confirm your new password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirmation')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.confirmation ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.newPasswordConfirmation && (
            <p className="mt-1 text-sm text-red-600">{errors.newPasswordConfirmation}</p>
          )}
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li className="flex items-center gap-2">
              <div className={`w-1 h-1 rounded-full ${formData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`} />
              At least 6 characters long
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1 h-1 rounded-full ${formData.newPassword !== formData.currentPassword && formData.newPassword ? 'bg-green-500' : 'bg-gray-300'}`} />
              Different from current password
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1 h-1 rounded-full ${formData.newPassword === formData.newPasswordConfirmation && formData.newPassword ? 'bg-green-500' : 'bg-gray-300'}`} />
              Passwords match
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2A3262' }}
          >
            {isSubmitting ? 'Updating Password...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordComponent;