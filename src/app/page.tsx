"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Facebook, Instagram, Linkedin, Youtube, Phone, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Import your image assets
import askingQuestionImage from '@/assets/images/hero/asking-question.png';
import listeningMusicImage from '@/assets/images/learning-assets/listening-music.png';

const EnhancedHomepage = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const testCards = [
    {
      title: "Visual, Auditory, Reading, Kinesthetic",
      subtitle: "VARK Learning Style Assessment",
      buttonText: "Start Exam",
      href: "/test-vark",
      description: "Discover how you learn best through our comprehensive VARK assessment"
    },
    {
      title: "AI Knowledge",
      subtitle: "Artificial Intelligence Assessment",
      buttonText: "Start Exam",
      href: "/test",
      description: "Test your understanding of AI concepts and technologies"
    },
    {
      title: "Learning Behavior",
      subtitle: "Behavioral Learning Patterns",
      buttonText: "Start Exam", 
      href: "/test",
      description: "Analyze your learning behaviors and study patterns"
    },
    {
      title: "Additional Measurement",
      subtitle: "Comprehensive Assessment",
      buttonText: "Start Exam",
      href: "/test",
      description: "Additional metrics to understand your learning profile"
    }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
        <Link href="/" className="flex items-center">
          <div className="w-8 h-8 bg-gray-800 rounded mr-2"></div>
          <span className="font-bold text-lg">logoipsum</span>
        </Link>
        <nav className="flex items-center space-x-8">
          <Link href="/" className="text-gray-700 hover:text-blue-600 border-b-2 border-blue-600">Home</Link>
          <Link href="/about" className="text-gray-700 hover:text-blue-600">About Us</Link>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>

        {/* Add floating animation keyframes */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .delay-100 {
            animation-delay: 0.5s;
          }
          .delay-200 {
            animation-delay: 1s;
          }
          .delay-300 {
            animation-delay: 1.5s;
          }
        `}</style>
                <span className="text-sm font-medium text-gray-700">
                  Hi, {user?.name || 'User'}
                </span>
              </div>
              <Link href="/profile" className="text-gray-700 hover:text-blue-600">Profile</Link>
              <button 
                onClick={logout}
                className="flex items-center space-x-1 text-gray-700 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
          )}
        </nav>
      </header>

      {/* Welcome Message for Authenticated Users */}
      {isAuthenticated && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-blue-900">
                  Welcome back, {user?.name}! 👋
                </h2>
                <p className="text-blue-700">Ready to discover your learning style?</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">Email: {user?.email}</p>
                {user?.phone && (
                  <p className="text-sm text-blue-600">Phone: {user?.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Hero Section */}
      <section className="relative px-6 py-20 overflow-hidden" style={{ backgroundColor: '#2A3262' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-4 h-4 border-2 border-white rounded-full"></div>
          <div className="absolute top-20 right-20 w-6 h-6 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-3 h-3 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-5 h-5 border-2 border-white rounded-full"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-12">
              <h1 className="text-6xl font-bold mb-6 text-white leading-tight">
                People Have Their<br />
                <span style={{ color: '#ABD305' }}>Own Preferences</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100 leading-relaxed">
                Ever wonder what your learning<br />
                preferences are?
              </p>
              <p className="text-lg mb-10 text-blue-200">
                Discover your unique learning style with our comprehensive VARK assessment and unlock your full potential.
              </p>
              
              <div className="flex gap-4">
                {isAuthenticated ? (
                  <Link 
                    href="/test-vark"
                    className="inline-flex items-center px-8 py-4 bg-white rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                    style={{ color: '#2A3262' }}
                  >
                    Start Test Now
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/register"
                      className="inline-flex items-center px-8 py-4 bg-white rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                      style={{ color: '#2A3262' }}
                    >
                      Get Started
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link 
                      href="/login"
                      className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-900 transition-all duration-300"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 flex justify-center">
              {/* Your asking-question.png image */}
              <div className="relative w-96 h-80 flex items-center justify-center">
                <Image 
                  src={askingQuestionImage}
                  alt="Person asking questions about learning preferences"
                  width={350}
                  height={350}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Test Selection Section */}
      <section className="py-20 relative overflow-hidden" style={{ backgroundColor: '#DFE4FF' }}>
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-20 h-20 rounded-full" style={{ backgroundColor: '#ABD305' }}></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full" style={{ backgroundColor: '#2A3262' }}></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6" style={{ color: '#2A3262' }}>
              Start unlocking your potential by selecting these test now!
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              With this test, you will find out your true potential and discover the best ways to enhance your learning experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {testCards.map((card, index) => (
              <div 
                key={index} 
                className="group relative rounded-2xl p-8 text-center transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col h-full"
                style={{ backgroundColor: '#ABD305' }}
              >
                {/* Icon container */}
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    {/* Main icon - your listening-music.png without circle background */}
                    <Image 
                      src={listeningMusicImage} 
                      alt={card.subtitle} 
                      width={80} 
                      height={80}
                      className="object-contain"
                    />
                  </div>
                </div>
                
                <div className="flex-grow">
                  <h3 className="text-white font-bold mb-2 text-lg leading-tight">
                    {card.subtitle}
                  </h3>
                  <h4 className="text-white font-medium mb-4 text-sm leading-tight opacity-90">
                    {card.title}
                  </h4>
                  <p className="text-white text-xs mb-6 opacity-80 leading-relaxed">
                    {card.description}
                  </p>
                </div>
                
                {/* Button at bottom */}
                <div className="mt-auto">
                  {isAuthenticated ? (
                    <Link
                      href={card.href}
                      className="block w-full py-3 bg-white rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md"
                      style={{ color: '#2A3262' }}
                    >
                      {card.buttonText}
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="block w-full py-3 bg-white rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md"
                      style={{ color: '#2A3262' }}
                    >
                      Login to Start
                    </Link>
                  )}
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
          
          {/* Call to Action */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg">
              <span className="text-sm font-medium" style={{ color: '#2A3262' }}>
                ✨ Start with our most popular VARK assessment
              </span>
              {isAuthenticated ? (
                <Link 
                  href="/test-vark"
                  className="ml-2 px-4 py-2 rounded-full font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#ABD305' }}
                >
                  Begin Now
                </Link>
              ) : (
                <Link 
                  href="/register"
                  className="ml-2 px-4 py-2 rounded-full font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#ABD305' }}
                >
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Academic Potential Test Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-4xl font-bold mb-6" style={{ color: '#2A3262' }}>
                We Also Have<br />
                Academic Potential<br />
                Test ( TPA )
              </h2>
              <p className="text-lg mb-6" style={{ color: '#2A3262' }}>
                To measure your intellectual abilities<br />
                in terms of reasoning, logic, and<br />
                conceptual understanding.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Comprehensive Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Detailed Report</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>Professional Insights</span>
                </div>
              </div>
            </div>
            
            <div className="ml-8">
              <div 
                className="rounded-2xl p-8 text-center w-80 transform hover:scale-105 transition-all duration-300 shadow-lg"
                style={{ backgroundColor: '#ABD305' }}
              >
                <h3 className="text-white font-bold text-xl mb-6">
                  Academic<br />
                  Potential Test
                </h3>
                
                {/* Enhanced illustration */}
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <Image 
                      src={listeningMusicImage} 
                      alt="Academic Potential Test" 
                      width={48} 
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex justify-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                    <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                
                {isAuthenticated ? (
                  <button 
                    onClick={() => alert('TPA test will be available soon!')}
                    className="w-full py-3 bg-white rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-md"
                    style={{ color: '#2A3262' }}
                  >
                    Start Test Now
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="block w-full py-3 bg-white rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-md"
                    style={{ color: '#2A3262' }}
                  >
                    Login to Start
                  </Link>
                )}
                
                <p className="text-white text-xs mt-3 opacity-80">
                  Coming Soon - Advanced Assessment
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

export default EnhancedHomepage;