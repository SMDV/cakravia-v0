"use client"

import React from 'react';
import { User, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="about" />

      {/* Hero Section */}
      <section className="px-6 py-16" style={{ backgroundColor: '#2A3262' }}>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg p-8 mb-12">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-medium mb-4" style={{ color: '#ABD305' }}>Our Mission</h2>
                <h1 className="text-4xl font-bold mb-6 text-white">Cakravia is for you</h1>
                <p className="text-white text-lg leading-relaxed">
                  CAKRAVIA IS Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam luctus nec 
                  purus in pulvinar. Ut nec vulputate dolor, dictum suscipit leo. Morbi vehicula metus 
                  ligula, eget porta magna lobortis nec.
                </p>
              </div>
              <div className="ml-8">
                <div className="w-64 h-48 border-2 border-white rounded-lg flex items-center justify-center relative">
                  {/* Illustration placeholder */}
                  <div className="absolute top-4 left-4">
                    <div className="w-12 h-8 border border-white rounded"></div>
                    <div className="w-8 h-1 bg-white mt-1"></div>
                    <div className="w-6 h-1 bg-white mt-1"></div>
                    <div className="w-4 h-1 bg-white mt-1"></div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ABD305' }}>
                      <User className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-8 right-8">
                    <div className="w-8 h-8 border border-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Take Test Section */}
      <section className="py-16" style={{ backgroundColor: '#DFE4FF' }}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#2A3262' }}>Why you should take Our Test?</h2>
          <p className="text-lg mb-12" style={{ color: '#2A3262' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam luctus nec purus in pulvinar.
          </p>
          
          <div className="grid grid-cols-4 gap-8 mb-16">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4" style={{ color: '#2A3262' }} />
                <p className="font-medium" style={{ color: '#2A3262' }}>Advantage {item}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#2A3262' }}>
              Start unlocking your potential by doing exams now!
            </h3>
            <p className="text-lg mb-8" style={{ color: '#2A3262' }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam luctus nec purus in pulvinar.
            </p>
            <button 
              className="px-8 py-3 rounded-lg text-white font-medium text-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#ABD305' }}
            >
              Start Test Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutUsPage;