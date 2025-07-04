"use client"

import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Youtube, Phone, Mail } from 'lucide-react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  return (
    <footer className={`py-12 ${className}`} style={{ backgroundColor: '#212437' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded mr-2"></div>
            <span className="font-bold text-lg text-white">logoipsum</span>
          </div>
          
          <div className="flex flex-col lg:flex-row space-y-8 lg:space-y-0 lg:space-x-12 w-full lg:w-auto">
            {/* Navigation Links */}
            <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
              <Link href="/" className="text-white hover:text-gray-300 transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-white hover:text-gray-300 transition-colors">
                About us
              </Link>
              <Link href="#" className="text-white hover:text-gray-300 transition-colors">
                Terms of use
              </Link>
              <Link href="#" className="text-white hover:text-gray-300 transition-colors">
                Privacy policy
              </Link>
            </nav>
            
            {/* Contact and Social */}
            <div className="text-left lg:text-right">
              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center lg:justify-end">
                  <Mail className="w-4 h-4 mr-2 text-white" />
                  <span className="text-white text-sm sm:text-base">support@cakravia.com</span>
                </div>
                <div className="flex items-center lg:justify-end">
                  <Phone className="w-4 h-4 mr-2 text-white" />
                  <span className="text-white text-sm sm:text-base">+62 812-3456-789</span>
                </div>
              </div>
              
              {/* Social Media */}
              <div className="lg:text-right">
                <p className="text-white mb-2 text-sm sm:text-base">Follow us:</p>
                <div className="flex lg:justify-end space-x-3">
                  <Link href="#" aria-label="Facebook">
                    <Facebook className="w-6 h-6 text-white hover:text-blue-400 cursor-pointer transition-colors" />
                  </Link>
                  <Link href="#" aria-label="Instagram">
                    <Instagram className="w-6 h-6 text-white hover:text-pink-400 cursor-pointer transition-colors" />
                  </Link>
                  <Link href="#" aria-label="LinkedIn">
                    <Linkedin className="w-6 h-6 text-white hover:text-blue-500 cursor-pointer transition-colors" />
                  </Link>
                  <Link href="#" aria-label="YouTube">
                    <Youtube className="w-6 h-6 text-white hover:text-red-500 cursor-pointer transition-colors" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="text-center pt-8 border-t border-gray-600 mt-8">
          <p className="text-gray-400 text-sm sm:text-base">
            Copyright © Cakravia 2025
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;