"use client"

import React, { useState } from 'react';
import { User, Facebook, Instagram, Linkedin, Youtube, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

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
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-800 rounded mr-2"></div>
          <span className="font-bold text-lg">logoipsum</span>
        </div>
        <nav className="flex space-x-8">
          <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
          <Link href="/about" className="text-gray-700 hover:text-blue-600">About Us</Link>
          <Link href="/profile" className="text-gray-700 hover:text-blue-600 border-b-2 border-blue-600">Login</Link>
        </nav>
      </header>

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
      <footer className="py-12" style={{ backgroundColor: '#212437' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 bg-white rounded mr-2"></div>
              <span className="font-bold text-lg text-white">logoipsum</span>
            </div>
            
            <div className="flex space-x-12">
              <nav className="flex space-x-8">
                <Link href="/" className="text-white hover:text-gray-300">Home</Link>
                <Link href="/about" className="text-white hover:text-gray-300">About us</Link>
                <a href="#" className="text-white hover:text-gray-300">Terms of use</a>
                <a href="#" className="text-white hover:text-gray-300">Privacy policy</a>
              </nav>
              
              <div className="text-right">
                <div className="flex items-center text-white mb-2">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>support@cakravia.com</span>
                </div>
                <div className="flex items-center text-white mb-4">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>+62 812-3456-789</span>
                </div>
                
                <div>
                  <p className="text-white mb-2">Follow us:</p>
                  <div className="flex space-x-3">
                    <Facebook className="w-6 h-6 text-white hover:text-blue-400 cursor-pointer" />
                    <Instagram className="w-6 h-6 text-white hover:text-pink-400 cursor-pointer" />
                    <Linkedin className="w-6 h-6 text-white hover:text-blue-500 cursor-pointer" />
                    <Youtube className="w-6 h-6 text-white hover:text-red-500 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-gray-600">
            <p className="text-gray-400">Copyright © Cakravia 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfileForm;