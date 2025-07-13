// src/app/page.tsx - Updated with carousel section and modified test selection

"use client"

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import your image assets
import askingQuestionImage from '@/assets/images/hero/asking-question.png';
import listeningMusicImage from '@/assets/images/learning-assets/listening-music.png';
import listeningMusicImage2x from '@/assets/images/learning-assets/listening-music-2x.png';
import TestChatBg from '@/assets/background/TestChatbg.png';

const EnhancedHomepage = () => {
  const { isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  // Carousel content
  const carouselItems = [
    {
      title: "VARK Learning Style Assessment",
      subtitle: "Uncover Your Unique Learning Blueprint: The VARK Learning Style Assessment.",
      description: "The VARK Learning Style Assessment on Cakravia is your key to understanding your innate preferences for absorbing and processing information. VARK illuminates whether you learn best visually, aurally, through reading/writing, or kinaesthetically. Discover your dominant learning style(s) and gain invaluable insights to optimize your study habits, enhance retention, and make every learning experience more effective and enjoyable.",
      available: true,
      href: "/test"
    },
    {
      title: "Artificial Intelligence Assessment",
      subtitle: "Validate Your Knowledge: The Definitive Artificial Intelligence Assessment.",
      description: "Are you confident in your grasp of Artificial Intelligence? Cakravia presents a comprehensive assessment crafted to rigorously test your understanding of AI concepts and technologies. Whether you're an aspiring data scientist, a tech enthusiast, or a professional navigating AI's impact, this assessment provides a clear benchmark of your proficiency. Identify your expertise in key AI domains and gain the clarity needed to advance your skills and career in this pivotal field.",
      available: false,
      href: "#"
    },
    {
      title: "Comprehensive Assessment",
      subtitle: "Build Your Foundation: Discover Your Resilience and Self-Esteem with Cakravia's Comprehensive Assessment.",
      description: "True learning and growth extend beyond academic knowledge – they are deeply rooted in your inner strength. Cakravia's Comprehensive Assessment offers a profound exploration of two critical pillars of personal development: resilience and self-esteem. This assessment is designed to help you understand your capacity to bounce back from challenges, adapt to change, and maintain a healthy sense of self-worth. Uncover your inherent strengths, identify areas for cultivation, and build an unshakeable foundation for lifelong success and well-being.",
      available: false,
      href: "#"
    },
    {
      title: "Behavioral Learning Patterns Assessment",
      subtitle: "Unpack Your Habits, Optimize Your Learning: Discover Your Behavioral Learning Patterns.",
      description: "Ever wondered why some study sessions are incredibly productive while others feel like a struggle? Cakravia's Behavioral Learning Patterns assessment delves beyond what you learn to explore how you learn. This insightful tool analyzes your actual learning behaviors, habits, and study patterns, revealing the routines and approaches that either empower or hinder your progress. Gain a deeper understanding of your cognitive tendencies, identify areas for improvement, and cultivate more effective, sustainable learning practices.",
      available: false,
      href: "#"
    }
  ];

  const testCards = [
    {
      title: "Visual, Auditory, Reading, Kinesthetic",
      buttonText: "Start Exam",
      href: "/test",
      available: true
    },
    {
      title: "AI Knowledge",
      buttonText: "Coming Soon",
      href: "#",
      available: false
    },
    {
      title: "Learning Behavior",
      buttonText: "Coming Soon", 
      href: "#",
      available: false
    },
    {
      title: "Additional Measurement",
      buttonText: "Coming Soon",
      href: "#",
      available: false
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    resetAutoSlide();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
    resetAutoSlide();
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    resetAutoSlide();
  };

  // Auto slide functionality
  const startAutoSlide = () => {
    autoSlideRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 15000);
  };

  const resetAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
    startAutoSlide();
  };

  // Touch/Mouse drag functionality - REMOVED
  // Keeping only the auto-slide pause/resume functionality
  
  // Initialize auto slide on component mount
  useEffect(() => {
    startAutoSlide();
    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, []);

  // Pause auto slide when user hovers over carousel
  const handleMouseEnter = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
  };

  const handleMouseLeave = () => {
    startAutoSlide();
  };

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
                Discover Your Learning<br />
                <span style={{ color: '#ABD305' }}>Superpower</span>
              </h1>
              <h2 className="text-xl sm:text-2xl lg:text-3xl mb-6 sm:mb-8 text-blue-100 leading-relaxed font-medium">
                Ever wondered how you truly learn best?
              </h2>
              <p className="text-base sm:text-lg mb-6 sm:mb-8 text-blue-200 leading-relaxed">
                Cakravia is your dedicated platform for uncovering the learning competencies that define your success. Our expertly designed assessments, from the renowned VARK Learning Style to in-depth Artificial Intelligence, Behavioral Learning Patterns, and Comprehensive Assessments, offer unparalleled clarity into your cognitive landscape.
              </p>
              <p className="text-base sm:text-lg mb-8 sm:mb-10 text-blue-200 leading-relaxed">
                Discover your strengths, understand your patterns, and unlock a more effective, fulfilling learning experience.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
                {isAuthenticated ? (
                  <Link 
                    href="/test"
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

      {/* New Carousel Section */}
      <section 
        className="py-12 sm:py-16 lg:py-20 relative overflow-hidden bg-white"
      >
        {/* Left Navigation Arrow */}
        <button
          onClick={prevSlide}
          className="absolute left-4 sm:left-6 lg:left-8 top-1/2 transform -translate-y-1/2 z-30 p-3 sm:p-4 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          style={{ color: '#2A3262' }}
        >
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Navigation Arrow */}
        <button
          onClick={nextSlide}
          className="absolute right-4 sm:right-6 lg:right-8 top-1/2 transform -translate-y-1/2 z-30 p-3 sm:p-4 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          style={{ color: '#2A3262' }}
        >
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <div className="max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="flex items-center justify-center min-h-[500px] sm:min-h-[600px]">
            {/* Much Wider Carousel Card - Takes up most of screen width */}
            <div className="w-full">
              <div 
                ref={carouselRef}
                className="group relative rounded-2xl p-6 sm:p-8 lg:p-12 xl:p-16 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl"
                style={{ backgroundColor: '#ABD305' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="px-4 sm:px-8 lg:px-12 xl:px-16">
                  {/* First Row: Text Content and Image */}
                  <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 xl:gap-20 mb-8">
                    {/* Text Content - Left Column */}
                    <div className="flex-1 text-center lg:text-left">
                      <h3 className="text-white font-bold mb-4 sm:mb-6 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl leading-tight">
                        {carouselItems[currentSlide].title}
                      </h3>
                      <h4 className="text-white text-lg sm:text-xl lg:text-2xl xl:text-3xl font-medium mb-6 sm:mb-8 opacity-90 leading-relaxed italic">
                        {carouselItems[currentSlide].subtitle}
                      </h4>
                      <p className="text-white text-base sm:text-lg lg:text-xl xl:text-xl mb-0 opacity-90 leading-relaxed max-w-4xl mx-auto lg:mx-0">
                        {carouselItems[currentSlide].description}
                      </p>
                      
                      {!carouselItems[currentSlide].available && (
                        <p className="text-white text-base sm:text-lg font-semibold opacity-90 mt-6">
                          🚧 In Development
                        </p>
                      )}
                    </div>
                    
                    {/* Image - Right Column */}
                    <div className="flex-shrink-0 order-first lg:order-last">
                      <div className="w-44 h-44 sm:w-56 sm:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 flex items-center justify-center">
                        <Image 
                          src={listeningMusicImage2x} 
                          alt={carouselItems[currentSlide].title} 
                          width={320} 
                          height={320}
                          className="object-contain w-full h-full"
                          draggable={false}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Second Row: Button Only */}
                  <div className="flex justify-center">
                    {carouselItems[currentSlide].available ? (
                      isAuthenticated ? (
                        <Link
                          href={carouselItems[currentSlide].href}
                          className="inline-flex items-center justify-center px-8 sm:px-10 lg:px-12 py-3 sm:py-4 bg-white rounded-lg font-semibold text-base sm:text-lg lg:text-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md"
                          style={{ color: '#2A3262' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Start Exam
                        </Link>
                      ) : (
                        <Link
                          href="/login"
                          className="inline-flex items-center justify-center px-8 sm:px-10 lg:px-12 py-3 sm:py-4 bg-white rounded-lg font-semibold text-base sm:text-lg lg:text-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md"
                          style={{ color: '#2A3262' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Start Exam
                        </Link>
                      )
                    ) : (
                      <button
                        disabled
                        className="px-8 sm:px-10 lg:px-12 py-3 sm:py-4 bg-gray-300 rounded-lg font-semibold text-base sm:text-lg lg:text-xl cursor-not-allowed text-gray-500 shadow-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Coming Soon
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Navigation Indicators */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <div className="flex gap-3">
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-blue-600 shadow-lg scale-125' 
                      : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modified Test Selection Section */}
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
                      alt={card.title} 
                      width={80} 
                      height={80}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
                
                <div className="flex-grow">
                  <h4 className="text-white text-base font-medium mb-3 sm:mb-4 text-sm leading-tight opacity-90">
                    {card.title}
                  </h4>
                  {!card.available && (
                    <p className="text-white text-xs font-semibold opacity-90 mb-2">
                      🚧 In Development
                    </p>
                  )}
                </div>
                
                <div className="mt-auto">
                  {card.available ? (
                    isAuthenticated ? (
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
                    )
                  ) : (
                    <button
                      disabled
                      className="w-full py-2 sm:py-3 bg-gray-300 rounded-lg font-semibold text-sm sm:text-base cursor-not-allowed text-gray-500"
                    >
                      {card.buttonText}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Call to Action */}
          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-2 px-4 sm:px-6 py-3 bg-white rounded-full shadow-lg">
              <span className="text-sm sm:text-base font-medium text-center" style={{ color: '#2A3262' }}>
                ✨ Start with our available VARK assessment
              </span>
              {isAuthenticated ? (
                <Link 
                  href="/test"
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
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
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
                
                <p className="text-white text-xs font-semibold opacity-90 mb-4">
                  🚧 In Development
                </p>
                
                <button 
                  disabled
                  className="w-full py-2 sm:py-3 bg-gray-300 rounded-lg font-semibold text-sm sm:text-base cursor-not-allowed text-gray-500 shadow-md"
                >
                  Coming Soon
                </button>
                
                <p className="text-white text-xs mt-3 opacity-80">
                  Advanced Assessment - Stay Tuned
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