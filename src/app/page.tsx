// src/app/page.tsx - Updated to use Header and Footer components

"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import your image assets
import askingQuestionImage from '@/assets/images/hero/asking-question.png';
import listeningMusicImage from '@/assets/images/learning-assets/listening-music.png';

const EnhancedHomepage = () => {
  const { isAuthenticated } = useAuth();

  const testCards = [
    {
      title: "Visual, Auditory, Reading, Kinesthetic",
      subtitle: "VARK Learning Style Assessment",
      buttonText: "Start Exam",
      href: "/test", // Updated to use /test instead of /test-vark
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
      <Header currentPage="home" />

      {/* Welcome Message for Authenticated Users */}
      {isAuthenticated && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-blue-900">
                  Welcome back! 👋
                </h2>
                <p className="text-sm sm:text-base text-blue-700">Ready to discover your learning style?</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Hero Section */}
      <section className="relative px-4 sm:px-6 py-12 sm:py-16 lg:py-20 overflow-hidden" style={{ backgroundColor: '#2A3262' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-5 sm:top-10 sm:left-10 w-3 h-3 sm:w-4 sm:h-4 border-2 border-white rounded-full"></div>
          <div className="absolute top-10 right-10 sm:top-20 sm:right-20 w-4 h-4 sm:w-6 sm:h-6 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-10 left-10 sm:bottom-20 sm:left-20 w-2 h-2 sm:w-3 sm:h-3 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-5 right-5 sm:bottom-10 sm:right-10 w-3 h-3 sm:w-5 sm:h-5 border-2 border-white rounded-full"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left lg:pr-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 text-white leading-tight">
                People Have Their<br />
                <span style={{ color: '#ABD305' }}>Own Preferences</span>
              </h1>
              <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-blue-100 leading-relaxed">
                Ever wonder what your learning<br className="hidden sm:block" />
                preferences are?
              </p>
              <p className="text-base sm:text-lg mb-8 sm:mb-10 text-blue-200">
                Discover your unique learning style with our comprehensive VARK assessment and unlock your full potential.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
                {isAuthenticated ? (
                  <Link 
                    href="/test" // Updated to use /test
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                    style={{ color: '#2A3262' }}
                  >
                    Start Test Now
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/register"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                      style={{ color: '#2A3262' }}
                    >
                      Get Started
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link 
                      href="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-white hover:text-blue-900 transition-all duration-300"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            {/* Image */}
            <div className="flex-1 flex justify-center lg:justify-end order-first lg:order-last">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-80 flex items-center justify-center">
                <Image 
                  src={askingQuestionImage}
                  alt="Person asking questions about learning preferences"
                  width={350}
                  height={350}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Test Selection Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden" style={{ backgroundColor: '#DFE4FF' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6" style={{ color: '#2A3262' }}>
              Start unlocking your potential by selecting these test now!
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
              With this test, you will find out your true potential and discover the best ways to enhance your learning experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {testCards.map((card, index) => (
              <div 
                key={index} 
                className="group relative rounded-2xl p-6 sm:p-8 text-center transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col h-full"
                style={{ backgroundColor: '#ABD305' }}
              >
                <div className="mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <Image 
                      src={listeningMusicImage} 
                      alt={card.subtitle} 
                      width={80} 
                      height={80}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
                
                <div className="flex-grow">
                  <h3 className="text-white font-bold mb-2 text-base sm:text-lg leading-tight">
                    {card.subtitle}
                  </h3>
                  <h4 className="text-white font-medium mb-3 sm:mb-4 text-sm leading-tight opacity-90">
                    {card.title}
                  </h4>
                  <p className="text-white text-xs sm:text-sm mb-4 sm:mb-6 opacity-80 leading-relaxed">
                    {card.description}
                  </p>
                </div>
                
                <div className="mt-auto">
                  {isAuthenticated ? (
                    <Link
                      href={card.href}
                      className="block w-full py-2 sm:py-3 bg-white rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md"
                      style={{ color: '#2A3262' }}
                    >
                      {card.buttonText}
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="block w-full py-2 sm:py-3 bg-white rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md"
                      style={{ color: '#2A3262' }}
                    >
                      Login to Start
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Call to Action */}
          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-2 px-4 sm:px-6 py-3 bg-white rounded-full shadow-lg">
              <span className="text-sm sm:text-base font-medium text-center" style={{ color: '#2A3262' }}>
                ✨ Start with our most popular VARK assessment
              </span>
              {isAuthenticated ? (
                <Link 
                  href="/test" // Updated to use /test
                  className="px-4 py-2 rounded-full font-semibold text-white text-sm sm:text-base hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#ABD305' }}
                >
                  Begin Now
                </Link>
              ) : (
                <Link 
                  href="/register"
                  className="px-4 py-2 rounded-full font-semibold text-white text-sm sm:text-base hover:opacity-90 transition-opacity"
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
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6" style={{ color: '#2A3262' }}>
                We Also Have<br />
                Academic Potential<br />
                Test ( TPA )
              </h2>
              <p className="text-base sm:text-lg mb-4 sm:mb-6" style={{ color: '#2A3262' }}>
                To measure your intellectual abilities<br className="hidden sm:block" />
                in terms of reasoning, logic, and<br className="hidden sm:block" />
                conceptual understanding.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-gray-600">
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
            
            {/* TPA Card */}
            <div className="flex-1 flex justify-center order-1 lg:order-2">
              <div 
                className="rounded-2xl p-6 sm:p-8 text-center w-full max-w-sm transform hover:scale-105 transition-all duration-300 shadow-lg"
                style={{ backgroundColor: '#ABD305' }}
              >
                <h3 className="text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">
                  Academic<br />
                  Potential Test
                </h3>
                
                <div className="mb-4 sm:mb-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
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
                    className="w-full py-2 sm:py-3 bg-white rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-100 transition-all duration-300 shadow-md"
                    style={{ color: '#2A3262' }}
                  >
                    Start Test Now
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="block w-full py-2 sm:py-3 bg-white rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-100 transition-all duration-300 shadow-md"
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
      <Footer />
    </div>
  );
};

export default EnhancedHomepage;