"use client"

import React, { useState } from 'react';
import { User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface FormData {
  name: string;
  email: string;
  birthdate: string;
  phoneNumber: string;
}

const ProfileForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: 'Labubu Bububu',
    email: 'labubu.bububu@labubumail.com',
    birthdate: '31 February 1999',
    phoneNumber: '08888888888888888'
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    alert('Profile saved successfully!');
    console.log('Saved profile data:', formData);
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="profile" />

      {/* Form Section */}
      <div className="py-16 px-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Profile Picture */}
          <div className="text-center mb-8">
            <div 
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#2A3262' }}
            >
              <User className="w-12 h-12 text-white" />
            </div>
            <button 
              className="text-sm font-medium hover:underline"
              style={{ color: '#2A3262' }}
              onClick={() => alert('Photo upload functionality would be implemented here')}
            >
              Choose Photo
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: '#2A3262' }}
              >
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                style={{ 
                  backgroundColor: '#F8F9FA'
                }}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email Field */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: '#2A3262' }}
              >
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                style={{ 
                  backgroundColor: '#F8F9FA'
                }}
                placeholder="Enter your email address"
              />
            </div>

            {/* Birthdate Field */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: '#2A3262' }}
              >
                Birthdate
              </label>
              <input
                type="text"
                value={formData.birthdate}
                onChange={(e) => handleInputChange('birthdate', e.target.value)}
                placeholder="DD Month YYYY"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                style={{ 
                  backgroundColor: '#F8F9FA'
                }}
              />
            </div>

            {/* Phone Number Field */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: '#2A3262' }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                style={{ 
                  backgroundColor: '#F8F9FA'
                }}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8">
            <button 
              className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#2A3262' }}
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProfileForm;