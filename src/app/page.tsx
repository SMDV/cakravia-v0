"use client"

import React from 'react';
import { User, Facebook, Instagram, Linkedin, Youtube, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

const TestSelectionPage = () => {
  const testCards = [
    {
      title: "Visual, Auditory, Reading, Kinesthetic",
      buttonText: "Start Exam"
    },
    {
      title: "AI Knowledge",
      buttonText: "Start Exam"
    },
    {
      title: "Learning Behavior",
      buttonText: "Start Exam"
    },
    {
      title: "Additional Measurement",
      buttonText: "Start Exam"
    }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-800 rounded mr-2"></div>
          <span className="font-bold text-lg">logoipsum</span>
        </div>
        <nav className="flex space-x-8">
          <Link href="/" className="text-gray-700 hover:text-blue-600 border-b-2 border-blue-600">Home</Link>
          <Link href="/about" className="text-gray-700 hover:text-blue-600">About Us</Link>
          <Link href="/profile" className="text-gray-700 hover:text-blue-600">Login</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16" style={{ backgroundColor: '#2A3262' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between text-white">
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-6">
                People Have Their<br />
                Own Preferences
              </h1>
              <p className="text-xl mb-8">
                Ever wonder what your learning<br />
                preferences are ?
              </p>
              <button 
                className="px-8 py-3 bg-white rounded-lg font-medium hover:bg-gray-100 transition-colors"
                style={{ color: '#2A3262' }}
              >
                Start Test Now
              </button>
            </div>
            <div className="ml-8">
              {/* Illustration */}
              <div className="w-80 h-64 relative">
                <div className="absolute top-8 right-16">
                  <div className="text-6xl" style={{ color: '#ABD305' }}>?</div>
                </div>
                <div className="absolute top-4 right-8">
                  <div className="text-4xl text-blue-300">?</div>
                </div>
                <div className="absolute top-12 right-32">
                  <div className="text-3xl text-blue-200">?</div>
                </div>
                <div className="absolute bottom-8 left-8">
                  <div className="w-32 h-32 border-2 border-white rounded-lg flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-16 right-4">
                  <div className="w-8 h-1 bg-white mb-1"></div>
                  <div className="w-6 h-1 bg-white mb-1"></div>
                  <div className="w-4 h-1 bg-white"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Test Selection Section */}
      <section className="py-16" style={{ backgroundColor: '#DFE4FF' }}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#2A3262' }}>
            Start unlocking your potential by selecting these test now!
          </h2>
          <p className="text-lg mb-12" style={{ color: '#2A3262' }}>
            With this test, you will find out your true potential
          </p>
          
          <div className="grid grid-cols-4 gap-6 mb-16">
            {testCards.map((card, index) => (
              <div 
                key={index} 
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: '#ABD305' }}
              >
                {/* Person illustration */}
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                </div>
                
                <h3 className="text-white font-medium mb-6 text-sm leading-tight">
                  {card.title}
                </h3>
                
                <button 
                  className="w-full py-2 bg-white rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  style={{ color: '#2A3262' }}
                >
                  {card.buttonText}
                </button>
              </div>
            ))}
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
              <p className="text-lg" style={{ color: '#2A3262' }}>
                To measure your intellectual abilities<br />
                in terms of reasoning, logic, and<br />
                conceptual understanding.
              </p>
            </div>
            
            <div className="ml-8">
              <div 
                className="rounded-xl p-8 text-center w-80"
                style={{ backgroundColor: '#ABD305' }}
              >
                <h3 className="text-white font-bold text-xl mb-6">
                  Academic<br />
                  Potential Test
                </h3>
                
                {/* Person illustration */}
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                </div>
                
                <button 
                  className="w-full py-3 bg-white rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  style={{ color: '#2A3262' }}
                >
                  Start Test Now
                </button>
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

export default TestSelectionPage;