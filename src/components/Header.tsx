"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  currentPage?: string; // Accept any string for scalability with multiple test types
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentPage = 'home', transparent = false }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const headerClasses = transparent 
    ? "relative z-10 bg-white/95 backdrop-blur-sm shadow-sm"
    : "bg-white shadow-sm";

  const isCurrentPage = (page: string) => currentPage === page;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Helper function to get the full avatar URL
  const getAvatarUrl = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return null;
    return avatarUrl.startsWith('http') ? avatarUrl : `https://api.cakravia.com${avatarUrl}`;
  };

  // Avatar component for reuse
  const UserAvatar = ({ size = 'sm', className = '' }: { size?: 'sm' | 'md'; className?: string }) => {
    const avatarUrl = getAvatarUrl(user?.avatar_url);
    const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
    
    return avatarUrl ? (
      <div className={`${sizeClasses} rounded-full overflow-hidden border-2 border-gray-200 ${className}`}>
        <Image
          src={avatarUrl}
          alt={user?.name || 'User'}
          width={size === 'sm' ? 32 : 40}
          height={size === 'sm' ? 32 : 40}
          className="w-full h-full object-cover"
        />
      </div>
    ) : (
      <div className={`${sizeClasses} bg-blue-100 rounded-full flex items-center justify-center ${className}`}>
        <User className={`${size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'} text-blue-600`} />
      </div>
    );
  };

  return (
    <header className={`${headerClasses} sticky top-0 z-50`}>
      <div className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
          <div className="w-8 h-8 bg-gray-800 rounded mr-2"></div>
          <span className="font-bold text-lg">logoipsum</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            href="/" 
            className={`text-gray-700 hover:text-blue-600 transition-colors ${
              isCurrentPage('home') ? 'border-b-2 border-blue-600 pb-1' : ''
            }`}
          >
            Home
          </Link>
          <Link 
            href="/about" 
            className={`text-gray-700 hover:text-blue-600 transition-colors ${
              isCurrentPage('about') ? 'border-b-2 border-blue-600 pb-1' : ''
            }`}
          >
            About Us
          </Link>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-6">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <UserAvatar size="sm" />
                <div className="hidden lg:block">
                  <span className="text-sm font-medium text-gray-700">
                    Hi, {user?.name || 'User'}
                  </span>
                </div>
              </div>
              
              {/* Profile Link */}
              <Link 
                href="/profile" 
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  isCurrentPage('profile') ? 'border-b-2 border-blue-600 pb-1' : ''
                }`}
              >
                Profile
              </Link>
              
              {/* Logout */}
              <button 
                onClick={logout}
                className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isCurrentPage('login') ? 'border-b-2 border-blue-600 pb-1' : ''
              }`}
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-2 space-y-1">
            {/* Navigation Links */}
            <Link 
              href="/" 
              className={`block px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                isCurrentPage('home') ? 'bg-blue-50 text-blue-600' : ''
              }`}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className={`block px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                isCurrentPage('about') ? 'bg-blue-50 text-blue-600' : ''
              }`}
              onClick={closeMobileMenu}
            >
              About Us
            </Link>
            
            {isAuthenticated ? (
              <>
                {/* User Info Section */}
                <div className="px-3 py-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <UserAvatar size="md" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Profile Link */}
                <Link 
                  href="/profile" 
                  className={`block px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                    isCurrentPage('profile') ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </div>
                </Link>
                
                {/* Logout */}
                <button 
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                  }}
                  className="w-full text-left px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </div>
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className={`block px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                  isCurrentPage('login') ? 'bg-blue-50 text-blue-600' : ''
                }`}
                onClick={closeMobileMenu}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;