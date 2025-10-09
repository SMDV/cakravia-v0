"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Youtube, Phone, Mail } from 'lucide-react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  return (
    <footer className={`py-12 ${className}`} style={{ backgroundColor: '#212437' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center lg:items-start">
          {/* Left: Logo */}
          <div className="flex justify-center lg:justify-start lg:col-span-2 lg:items-center lg:h-full">
            <div className="flex items-center">
              <Image
                src="/logo_cakravia.jpg"
                alt="Cakravia Logo"
                width={120}
                height={68}
                className="rounded"
              />
            </div>
          </div>
          
          {/* Middle: Navigation Links (center aligned) */}
          <div className="flex justify-center lg:col-span-1 lg:items-center lg:h-full">
            <nav className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8 lg:space-x-12 text-center">
              <Link href="/" className="text-white hover:text-gray-300 transition-colors whitespace-nowrap font-bold text-lg">
                Home
              </Link>
              <Link href="/about" className="text-white hover:text-gray-300 transition-colors whitespace-nowrap font-bold text-lg">
                About us
              </Link>
              <Link href="#" className="text-white hover:text-gray-300 transition-colors whitespace-nowrap font-bold text-lg">
                Terms of use
              </Link>
              <Link href="#" className="text-white hover:text-gray-300 transition-colors whitespace-nowrap font-bold text-lg">
                Privacy policy
              </Link>
            </nav>
          </div>
          
          {/* Right: Contact and Social */}
          <div className="text-center lg:text-right lg:col-span-2 lg:flex lg:flex-col lg:justify-center lg:h-full">
            {/* Contact Info */}
            <div className="space-y-2 mb-6 lg:mb-8">
              <div className="flex items-center justify-center lg:justify-end">
                <Mail className="w-4 h-4 mr-2 text-white" />
                <span className="text-white text-sm sm:text-base">support@cakravia.com</span>
              </div>
              <div className="flex items-center justify-center lg:justify-end">
                <Phone className="w-4 h-4 mr-2 text-white" />
                <span className="text-white text-sm sm:text-base">+62 812-3456-789</span>
              </div>
            </div>
            
            {/* Social Media */}
            <div>
              <p className="text-white mb-2 text-sm sm:text-base font-bold text-center lg:text-right">Follow us:</p>
              <div className="flex justify-center lg:justify-end space-x-3">
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