"use client"

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Edit, 
  Save, 
  X, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download,
  Play,
  FileText,
  Trophy,
  Activity,
  Shield,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import ChangePasswordComponent from '@/components/ChangePasswordComponent'; 

interface VarkTestHistory {
  id: string;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  question_set: {
    id: string;
    name: string;
    version: number;
    time_limit: number;
  };
  results: {
    id: string;
    visual_score: number;
    aural_score: number;
    read_score: number;
    kinesthetic_score: number;
    dominant_learning_styles: string[];
    created_at: string;
  } | null;
  order: {
    id: string;
    order_number: string;
    status: 'pending' | 'paid';
    amount: string;
    certificate_status: 'not_generated' | 'generated' | 'generation_failed';
    can_download_certificate: boolean;
    created_at: string;
  } | null;
  payment: {
    id: string;
    status: 'pending' | 'settlement';
    payment_method: string;
    paid_at: string | null;
    created_at: string;
  } | null;
  time_remaining: number;
  is_expired: boolean;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  birthday: string;
}

const EnhancedProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testHistory, setTestHistory] = useState<VarkTestHistory[]>([]);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    birthday: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Load profile data and test history
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        
        // Load profile data
        const profileResponse = await authAPI.getProfile();
        const userData = profileResponse.data;
        
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          birthday: userData.birthday || ''
        });

        // Load test history using the endpoint from your Postman collection
        try {
          const historyResponse = await fetch('https://api.cakravia.com/api/v1/users/vark_tests', {
            headers: {
              'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]?.split(';')[0]}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            setTestHistory(historyData.data || []);
          }
        } catch (historyError) {
          console.error('Failed to load test history:', historyError);
        }
        
      } catch (error) {
        console.error('Failed to load profile data:', error);
        setErrors({ general: 'Failed to load profile data' });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProfileData();
    }
  }, [user]);

  // Handle form input changes
  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData(prev => ({
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

  // Handle file selection for avatar
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      // Create FormData for multipart form submission
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email); // Still send email in request
      formData.append('phone', profileData.phone);
      formData.append('birthday', profileData.birthday);
      
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }
      
      const response = await authAPI.updateProfile(formData);
      
      // Update user context
      updateUser(response.data);
      
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Show success message
      alert('Profile updated successfully!');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setErrors({ general: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    // Reset form data to original values
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birthday: user.birthday || ''
      });
    }
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrors({});
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s remaining`;
    } else {
      return `${remainingSeconds}s remaining`;
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid':
      case 'settlement':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'generated':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'generation_failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'not_generated':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get comprehensive test status
  const getTestStatus = (test: VarkTestHistory) => {
    // For completed tests, always show completed regardless of time
    if (test.status === 'completed') return 'completed';
    
    // For in-progress tests, show expired if time is up
    if (test.status === 'in_progress' && test.is_expired) return 'expired';
    
    // Otherwise use the API status
    return test.status;
  };

  // Calculate total score for a test
  const getTotalScore = (results: VarkTestHistory['results']) => {
    if (!results) return 0;
    return results.visual_score + results.aural_score + results.read_score + results.kinesthetic_score;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header currentPage="profile" />
        <div className="flex-1 py-16 px-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="profile" />

      <div className="flex-1 py-4 sm:py-8 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#2A3262' }}>
            My Profile
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your account settings and view your test history</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Profile Information Section */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              {/* Profile Picture */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="relative inline-block">
                  {previewUrl || user?.avatar_url ? (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-gray-200">
                      <Image
                        src={previewUrl || (user?.avatar_url?.startsWith('http') ? user.avatar_url : `https://api.cakravia.com${user?.avatar_url}`) || ''}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center border-4 border-gray-200"
                      style={{ backgroundColor: '#2A3262' }}
                    >
                      <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                  )}
                  
                  {isEditing && (
                    <label className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium hover:underline flex items-center gap-1 mx-auto"
                    style={{ color: '#2A3262' }}
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Error Message */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{errors.general}</span>
                  </div>
                </div>
              )}

              {/* Profile Form */}
              <div className="space-y-3 sm:space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: '#2A3262' }}>
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: '#F8F9FA' }}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm truncate">{profileData.name || 'Not provided'}</span>
                    </div>
                  )}
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                {/* Email Field - Modified to be non-editable */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: '#2A3262' }}>
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-100 rounded-lg border border-gray-200">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm truncate text-gray-600">{profileData.email || 'Not provided'}</span>
                    {isEditing && (
                      <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                        Not editable
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <p className="mt-1 text-xs text-gray-500">
                      Email cannot be changed. Contact support if you need to update your email address.
                    </p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: '#2A3262' }}>
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                      style={{ backgroundColor: '#F8F9FA' }}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm truncate">{profileData.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                {/* Birthday Field */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2" style={{ color: '#2A3262' }}>
                    Birthday
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={profileData.birthday}
                      onChange={(e) => handleInputChange('birthday', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                      style={{ backgroundColor: '#F8F9FA' }}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm truncate">{profileData.birthday || 'Not provided'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 text-sm rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: '#2A3262' }}
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="sm:w-auto px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                    <span className="sm:hidden ml-2">Cancel</span>
                  </button>
                </div>
              )}
            </div>
            {/* Password Change Section - NEW */}
            <div className="mt-4 sm:mt-6">
              {!showPasswordChange ? (
                // Show button when component is hidden
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors group"
                >
                  <Shield className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                  <span className="text-sm font-medium">Change Password</span>
                </button>
              ) : (
                // Show component when toggled on
                <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                  {/* Header with close button */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" style={{ color: '#2A3262' }} />
                      <h3 className="text-sm font-medium" style={{ color: '#2A3262' }}>
                        Change Password
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowPasswordChange(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Password Change Component without the header */}
                  <div className="p-4">
                    <ChangePasswordComponent className="!p-0 !shadow-none !bg-transparent" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test History Section - Rest of the component remains the same */}
          <div className="xl:col-span-2 order-1 xl:order-2">
            <div className="bg-white rounded-lg shadow-lg">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#2A3262' }}>
                      Test History
                    </h2>
                    <p className="text-gray-600 text-xs sm:text-sm">Your VARK learning style assessment history</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <span className="text-xs sm:text-sm font-medium text-gray-600">
                      {testHistory.length} test{testHistory.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Test History Content */}
              <div>
                {testHistory.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No tests taken yet</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">Start your learning journey by taking your first VARK assessment</p>
                    <Link
                      href="/test"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Take Your First Test
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="block md:hidden">
                      <div className="divide-y divide-gray-200">
                        {testHistory.map((test) => {
                          const testStatus = getTestStatus(test);
                          
                          return (
                            <div key={test.id} className="p-4 space-y-3">
                              {/* Test Info Header */}
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {test.question_set.name}
                                  </h3>
                                  <p className="text-xs text-gray-500">
                                    Version {test.question_set.version} • ID: {test.id.slice(0, 8)}...
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Started: {formatDate(test.started_at)}
                                  </p>
                                </div>
                                
                                {/* Main Status Badge */}
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(testStatus)}`}>
                                  {testStatus === 'completed' ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  ) : testStatus === 'expired' ? (
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Clock className="w-3 h-3 mr-1" />
                                  )}
                                  {testStatus === 'completed' ? 'Completed' : 
                                   testStatus === 'expired' ? 'Expired' : 'In Progress'}
                                </span>
                              </div>

                              {/* Time Info */}
                              {test.status === 'in_progress' && (
                                <div className="text-xs">
                                  {test.is_expired ? (
                                    <span className="text-red-600 font-medium">⚠️ Time Expired</span>
                                  ) : test.time_remaining > 0 ? (
                                    <span className="text-blue-600">⏱️ {formatTimeRemaining(test.time_remaining)}</span>
                                  ) : (
                                    <span className="text-gray-500">No time limit</span>
                                  )}
                                </div>
                              )}

                              {/* Results Info */}
                              <div>
                                {test.results ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Trophy className="w-4 h-4 text-yellow-500" />
                                      <span className="text-sm font-medium">Score: {getTotalScore(test.results)}</span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                      Dominant: {test.results.dominant_learning_styles.join(', ')}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      V:{test.results.visual_score} A:{test.results.aural_score} R:{test.results.read_score} K:{test.results.kinesthetic_score}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-400">
                                    {test.status === 'in_progress' && !test.is_expired ? (
                                      <span>📝 Test in progress</span>
                                    ) : test.is_expired ? (
                                      <span className="text-red-600">❌ Test expired before completion</span>
                                    ) : (
                                      <span>No results yet</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Payment & Certificate Info */}
                              <div className="flex flex-wrap gap-2 text-xs">
                                {test.payment ? (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium border ${getStatusBadge(test.payment.status)}`}>
                                    {test.payment.status === 'settlement' ? '💳 Paid' : '⏳ Pending'}
                                  </span>
                                ) : test.order ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full font-medium border bg-orange-100 text-orange-800 border-orange-200">
                                    💰 Payment Required
                                  </span>
                                ) : null}

                                {test.order && (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium border ${getStatusBadge(test.order.certificate_status)}`}>
                                    {test.order.certificate_status === 'generated' ? '📜' : 
                                     test.order.certificate_status === 'generation_failed' ? '❌' : '⏳'} 
                                    Certificate
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-2">
                                {test.status === 'completed' && test.results && (
                                  <Link
                                    href={`/results?testId=${test.id}`}
                                    className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Results
                                  </Link>
                                )}

                                {test.status === 'in_progress' && !test.is_expired && (
                                  <Link
                                    href={`/test?resumeTestId=${test.id}`}
                                    className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-3 py-2 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 transition-colors"
                                  >
                                    <Play className="w-3 h-3" />
                                    Continue
                                  </Link>
                                )}

                                {test.is_expired && test.status === 'in_progress' && (
                                  <Link
                                    href="/test"
                                    className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors"
                                  >
                                    <Play className="w-3 h-3" />
                                    Retake
                                  </Link>
                                )}

                                {test.order?.can_download_certificate && (
                                  <button
                                    onClick={() => {
                                      window.open(`https://api.cakravia.com/api/v1/users/vark_tests/${test.id}/orders/download_certificate`, '_blank');
                                    }}
                                    className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                                  >
                                    <Download className="w-3 h-3" />
                                    Certificate
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Test Info
                            </th>
                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status & Timer
                            </th>
                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Results
                            </th>
                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment & Certificate
                            </th>
                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {testHistory.map((test) => {
                            const testStatus = getTestStatus(test);
                            
                            return (
                              <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                                {/* Test Info */}
                                <td className="px-4 lg:px-6 py-4">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {test.question_set.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Version {test.question_set.version}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Started: {formatDate(test.started_at)}
                                    </div>
                                    {test.completed_at && (
                                      <div className="text-xs text-gray-400">
                                        Completed: {formatDate(test.completed_at)}
                                      </div>
                                    )}
                                    <div className="text-xs text-blue-600 font-mono">
                                      ID: {test.id.slice(0, 8)}...
                                    </div>
                                  </div>
                                </td>

                                {/* Status & Timer */}
                                <td className="px-4 lg:px-6 py-4">
                                  <div className="space-y-2">
                                    {/* Main Test Status */}
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(testStatus)}`}>
                                      {testStatus === 'completed' ? (
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                      ) : testStatus === 'expired' ? (
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                      ) : (
                                        <Clock className="w-3 h-3 mr-1" />
                                      )}
                                      {testStatus === 'completed' ? 'Completed' : 
                                       testStatus === 'expired' ? 'Expired' : 'In Progress'}
                                    </span>
                                    
                                    {/* Time Remaining Info */}
                                    {test.status === 'in_progress' && (
                                      <div className="text-xs">
                                        {test.is_expired ? (
                                          <span className="text-red-600 font-medium">
                                            ⚠️ Time Expired
                                          </span>
                                        ) : test.time_remaining > 0 ? (
                                          <span className="text-blue-600">
                                            ⏱️ {formatTimeRemaining(test.time_remaining)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-500">
                                            No time limit
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Expired Badge */}
                                    {test.is_expired && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 border border-red-200">
                                        🚫 Expired
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Results */}
                                <td className="px-4 lg:px-6 py-4">
                                  {test.results ? (
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium text-gray-900">
                                        <Trophy className="w-4 h-4 inline mr-1 text-yellow-500" />
                                        Score: {getTotalScore(test.results)}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        Dominant: {test.results.dominant_learning_styles.join(', ')}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        V:{test.results.visual_score} A:{test.results.aural_score} R:{test.results.read_score} K:{test.results.kinesthetic_score}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <span className="text-sm text-gray-400">No results yet</span>
                                      {test.status === 'in_progress' && !test.is_expired && (
                                        <div className="text-xs text-blue-600">
                                          📝 Test in progress
                                        </div>
                                      )}
                                      {test.is_expired && (
                                        <div className="text-xs text-red-600">
                                          ❌ Test expired before completion
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Payment & Certificate */}
                                <td className="px-4 lg:px-6 py-4">
                                  <div className="space-y-2">
                                    {/* Payment Status */}
                                    {test.payment ? (
                                      <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(test.payment.status)}`}>
                                          {test.payment.status === 'settlement' ? '💳 Paid' : '⏳ Pending Payment'}
                                        </span>
                                        {test.payment.paid_at && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Paid: {formatDate(test.payment.paid_at)}
                                          </div>
                                        )}
                                      </div>
                                    ) : test.order ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-orange-100 text-orange-800 border-orange-200">
                                        💰 Payment Required
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">No payment info</span>
                                    )}

                                    {/* Certificate Status */}
                                    {test.order && (
                                      <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(test.order.certificate_status)}`}>
                                          {test.order.certificate_status === 'generated' ? '📜 Available' : 
                                           test.order.certificate_status === 'generation_failed' ? '❌ Failed' : 
                                           test.order.certificate_status === 'not_generated' ? '⏳ Not Generated' : '🔄 Processing'}
                                        </span>
                                        <div className="text-xs text-gray-500 mt-1">
                                          Rp {parseFloat(test.order.amount).toLocaleString('id-ID')}
                                        </div>
                                      </div>
                                    )}

                                    {/* No Order/Payment Info */}
                                    {!test.order && !test.payment && test.status === 'completed' && (
                                      <div className="text-xs text-gray-500">
                                        🆓 Free assessment
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Actions */}
                                <td className="px-4 lg:px-6 py-4">
                                  <div className="flex flex-col gap-2">
                                    {/* View Results */}
                                    {test.status === 'completed' && test.results ? (
                                      <Link
                                        href={`/results?testId=${test.id}`}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                                      >
                                        <Eye className="w-3 h-3" />
                                        View Results
                                      </Link>
                                    ) : null}

                                    {/* Continue Test */}
                                    {test.status === 'in_progress' && !test.is_expired ? (
                                      <Link
                                        href={`/test?resumeTestId=${test.id}`}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 transition-colors"
                                      >
                                        <Play className="w-3 h-3" />
                                        Continue
                                      </Link>
                                    ) : null}

                                    {/* Retake Expired Test */}
                                    {test.is_expired && test.status === 'in_progress' ? (
                                      <Link
                                        href="/test"
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors"
                                      >
                                        <Play className="w-3 h-3" />
                                        Retake
                                      </Link>
                                    ) : null}

                                    {/* Download Certificate */}
                                    {test.order?.can_download_certificate && (
                                      <button
                                        onClick={() => {
                                          window.open(`https://api.cakravia.com/api/v1/users/vark_tests/${test.id}/orders/download_certificate`, '_blank');
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                                      >
                                        <Download className="w-3 h-3" />
                                        Certificate
                                      </button>
                                    )}

                                    {/* No Actions Available */}
                                    {!test.results && 
                                     test.status !== 'in_progress' && 
                                     !test.order?.can_download_certificate && (
                                      <span className="text-xs text-gray-400 italic">
                                        No actions available
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Footer with action to take new test */}
              {testHistory.length > 0 && (
                <div className="p-4 sm:p-6 border-t border-gray-200 text-center">
                  <Link
                    href="/test"
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm sm:text-base"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                    Take Another Test
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - will stick to bottom */}
      <Footer />
    </div>
  );
};

export default EnhancedProfilePage;