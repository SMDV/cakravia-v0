"use client"

import React from 'react';
import { Target, Users, Award, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';

// Import your image assets
import designerKeynoteImage from '@/assets/images/hero/designer-giving-a-keynote.png';
import achievementImage from '@/assets/images/hero/achievement-10.png';

const AboutUsPage = () => {
  const { isAuthenticated } = useAuth();
  const features = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Personalized Learning",
      description: "Discover your unique learning style through our comprehensive VARK assessment and get personalized recommendations."
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Evidence-Based",
      description: "Our assessments are built on proven psychological and educational research methodologies."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "For Everyone",
      description: "Whether you're a student, educator, or professional, our tools help optimize your learning journey."
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Continuous Growth",
      description: "Track your progress and adapt your learning strategies as you grow and develop new skills."
    }
  ];

  const values = [
    {
      title: "Accessibility",
      description: "We believe quality education assessment should be available to everyone, regardless of background or circumstances."
    },
    {
      title: "Innovation",
      description: "We continuously evolve our platform using the latest research in learning science and educational psychology."
    },
    {
      title: "Empowerment",
      description: "Our mission is to empower individuals to understand their learning preferences and unlock their full potential."
    }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="about" />

      {/* Hero Section */}
      <section className="relative px-6 py-20 overflow-hidden" style={{ backgroundColor: '#2A3262' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-4 h-4 border-2 border-white rounded-full"></div>
          <div className="absolute top-20 right-20 w-6 h-6 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-3 h-3 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-5 h-5 border-2 border-white rounded-full"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-lg font-medium mb-4" style={{ color: '#ABD305' }}>About Cakravia</h2>
              <h1 className="text-5xl font-bold mb-6 text-white leading-tight">
                Empowering Your <span style={{ color: '#ABD305' }}>Learning Journey</span>
              </h1>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  We&#39;re more than just an assessment platform. We&#39;re your partner in understanding and optimizing your learning journey. Here&#39;s what makes us different:
                </p>
              <div className="flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Link 
                    href="/test"
                    className="inline-flex items-center px-6 py-3 bg-white rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg"
                    style={{ color: '#2A3262' }}
                  >
                    Take Assessment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                ) : (
                  <Link 
                    href="/login"
                    className="inline-flex items-center px-6 py-3 bg-white rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg"
                    style={{ color: '#2A3262' }}
                  >
                    Login to Start
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                )}
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle className="w-5 h-5" style={{ color: '#ABD305' }} />
                  <span>Free to get started</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative w-80 h-80 flex items-center justify-center">
                <Image 
                  src={designerKeynoteImage}
                  alt="Designer giving a keynote presentation about learning"
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

      {/* Our Mission Section */}
      <section className="py-20" style={{ backgroundColor: '#DFE4FF' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6" style={{ color: '#2A3262' }}>Our Mission</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              At Cakravia, we believe that understanding how you learn best is the key to unlocking your full potential. 
              Our mission is to provide accessible, scientifically-backed learning style assessments that help individuals 
              optimize their educational journey and achieve their goals more effectively.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ABD305' }}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#2A3262' }}>
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6" style={{ color: '#2A3262' }}>
                Why Choose Cakravia?
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We&#39re more than just an assessment platform. We&#39re your partner in understanding and optimizing your learning journey. Here&#39s what makes us different:
              </p>
              
              <div className="space-y-6">
                {values.map((value, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ABD305' }}>
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2" style={{ color: '#2A3262' }}>
                        {value.title}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative w-96 h-96 flex items-center justify-center">
                <Image 
                  src={achievementImage}
                  alt="Achievement and success in learning"
                  width={400}
                  height={400}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20" style={{ backgroundColor: '#2A3262' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Discover Your Learning Style?
          </h2>
          <p className="text-xl mb-8 text-blue-100 leading-relaxed">
            Join thousands of learners who have already discovered their unique learning preferences. 
            Start your journey today with our comprehensive VARK assessment.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <Link 
                href="/test"
                className="inline-flex items-center px-8 py-4 bg-white rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ color: '#2A3262' }}
              >
                Start Your Assessment
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            ) : (
              <Link 
                href="/login"
                className="inline-flex items-center px-8 py-4 bg-white rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ color: '#2A3262' }}
              >
                Login to Start Assessment
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}
            
            <div className="flex items-center gap-2 text-blue-100">
              <CheckCircle className="w-5 h-5" style={{ color: '#ABD305' }} />
              <span>Free • Takes few minutes! • Immediate results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutUsPage;