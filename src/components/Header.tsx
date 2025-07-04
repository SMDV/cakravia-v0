"use client"

import React from 'react';
import Link from 'next/link';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  currentPage?: 'home' | 'about' | 'login' | 'profile' | 'test' | 'results';
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentPage = 'home', transparent = false }) => {
  const { isAuthenticated, user, logout } = useAuth();

  const headerClasses = transparent 
    ? "relative z-10 flex justify-between items-center px-4 sm:px-6 py-4 bg-white/95 backdrop-blur-sm shadow-sm"
    : "flex justify-between items-center px-6 py-4 bg-white shadow-sm";

  const isCurrentPage = (page: string) => currentPage === page;

  return (
    <header className={headerClasses}>
      <Link href="/" className="flex items-center">
        <div className="w-8 h-8 bg-gray-800 rounded mr-2"></div>
        <span className="font-bold text-lg">logoipsum</span>
      </Link>
      
      <nav className="flex items-center space-x-4 sm:space-x-8">
        <Link 
          href="/" 
          className={`text-gray-700 hover:text-blue-600 text-sm sm:text-base ${
            isCurrentPage('home') ? 'border-b-2 border-blue-600' : ''
          }`}
        >
          Home
        </Link>
        <Link 
          href="/about" 
          className={`text-gray-700 hover:text-blue-600 text-sm sm:text-base ${
            isCurrentPage('about') ? 'border-b-2 border-blue-600' : ''
          }`}
        >
          About Us
        </Link>
        
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                Hi, {user?.name || 'User'}
              </span>
            </div>
            <Link 
              href="/profile" 
              className={`text-gray-700 hover:text-blue-600 text-sm sm:text-base ${
                isCurrentPage('profile') ? 'border-b-2 border-blue-600' : ''
              }`}
            >
              Profile
            </Link>
            <button 
              onClick={logout}
              className="flex items-center space-x-1 text-gray-700 hover:text-red-600 text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <Link 
            href="/login" 
            className={`text-gray-700 hover:text-blue-600 text-sm sm:text-base ${
              isCurrentPage('login') ? 'border-b-2 border-blue-600' : ''
            }`}
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;