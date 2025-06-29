"use client"

import React from 'react';
import { Facebook, Instagram, Linkedin, Youtube, Phone, Mail, Check, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';

// Import ApexCharts dynamically for client-side rendering
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

// Type definitions
interface SmallChartProps {
  score: number;
  name: string;
  color: string;
}

const ResultsDashboard = () => {
  // Data for ApexCharts Radial Bar Chart (Learning Preferences)
  const learningChartSeries = [150, 12, 18, 9];

  // Use a more flexible type for ApexCharts options
  const learningChartOptions = {
    chart: {
      height: 390,
      type: "radialBar" as const,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: "30%",
          background: "transparent",
          image: undefined,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: false,
          },
        },
        barLabels: {
          enabled: true,
          useSeriesColors: true,
          offsetX: -8,
          fontSize: "16px",
          formatter: (seriesName: string, opts: any) => 
            seriesName + ":  " + opts.w.globals.series[opts.seriesIndex],
        },
      },
    },
    colors: ["#1ab7ea", "#0084ff", "#39539E", "#0077B5"],
    labels: ["Visual", "Auditory", "Reading", "Kinesthetic"],
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            show: false,
          },
        },
      },
    ],
    legend: {
      show: false,
    },
  };

  // Individual scores component
  const SmallChart: React.FC<SmallChartProps> = ({ score, name, color }) => (
    <div className="rounded-xl overflow-hidden shadow-lg">
      <div 
        className="text-white text-center py-3 font-bold text-lg"
        style={{ backgroundColor: '#8BC34A' }}
      >
        {name} Score: {score}
      </div>
      <div className="p-6 bg-gray-50 flex justify-center">
        <div className="w-32 h-32 relative flex items-center justify-center">
          <svg className="transform -rotate-90" width="128" height="128" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={`${(score / 20) * 251.2} 251.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold" style={{ color: '#2A3262' }}>{score}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#E0E6F6] relative overflow-hidden" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white relative z-20">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-800 rounded mr-2"></div>
          <span className="font-bold text-lg">logoipsum</span>
        </div>
        <nav className="flex space-x-8">
          <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
          <Link href="/about" className="text-gray-700 hover:text-blue-600">About Us</Link>
          <Link href="/profile" className="text-gray-700 hover:text-blue-600">Login</Link>
        </nav>
      </header>

      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-auto opacity-50 z-0 pointer-events-none">
        <div className="w-64 h-64 bg-gradient-to-br from-purple-400 to-orange-400 rounded-full blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-full h-auto opacity-50 z-0 pointer-events-none">
        <div className="w-64 h-64 bg-gradient-to-br from-green-400 to-blue-400 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 py-12 md:py-24 lg:py-32 z-10 relative">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          {/* Top Section: Final Report */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 mb-12">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#4A47A3' }}>
                Here is your final report
              </h1>
              <div className="text-right">
                <p className="text-sm" style={{ color: '#4A47A3' }}>Certificate ID: 124095102958</p>
              </div>
            </div>

            {/* Main content: Chart LEFT, Descriptions RIGHT */}
            <div className="flex flex-row gap-12 items-start">
              {/* LEFT: Chart only */}
              <div className="w-1/2 flex justify-center">
                <Card className="rounded-lg overflow-hidden border-none shadow-lg">
                  <CardHeader className="bg-[#8BC34A] text-white rounded-t-lg py-4">
                    <CardTitle className="text-center text-2xl font-bold" style={{ color: '#24348C' }}>Total Learning Score</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 bg-[#F0F2F5]">
                    {/* ApexCharts component */}
                    <ApexCharts
                      options={learningChartOptions}
                      series={learningChartSeries}
                      type="radialBar"
                      height={390}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT: All descriptions + Download PDF */}
              <div className="w-1/2 space-y-6">
                {/* VARK Descriptions */}
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-1" style={{ color: '#8BC34A' }} />
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: '#2A3262' }}>Visual</h3>
                    <p className="text-sm text-gray-700">
                      Learning by looking at pictures, graphs, videos, and graphics. Could not take complete note during presentation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-1" style={{ color: '#8BC34A' }} />
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: '#2A3262' }}>Auditory</h3>
                    <p className="text-sm text-gray-700">
                      Receive learning by listening method, by speaking or from music, discussion, and explanation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-1" style={{ color: '#8BC34A' }} />
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: '#2A3262' }}>Reading</h3>
                    <p className="text-sm text-gray-700">
                      Prefer words and texts as an information obtaining method. They like presentation style, by text or writing
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-1" style={{ color: '#8BC34A' }} />
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: '#2A3262' }}>Kinesthetic</h3>
                    <p className="text-sm text-gray-700">
                      More likely to experience through physical movement aspect while studying, such as, touch, feel, hold, perform, and move something. They prefer hands on work, practical, project, and real experience
                    </p>
                  </div>
                </div>

                {/* Download PDF Button */}
                <div className="mt-8">
                  <button 
                    className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#4A47A3' }}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Style Details Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#4A47A3' }}>
              Your Learning Style
            </h2>
            
            <div className="flex flex-row gap-8 items-center">
              <div className="w-1/2 flex justify-center">
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <div 
                    className="text-white text-center py-3 font-bold text-lg"
                    style={{ backgroundColor: '#8BC34A' }}
                  >
                    Reading Score: 18
                  </div>
                  <div className="p-6 bg-gray-50">
                    <div className="w-48 h-48 mx-auto relative flex items-center justify-center">
                      <svg className="transform -rotate-90" width="192" height="192" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#06B6D4"
                          strokeWidth="8"
                          strokeDasharray={`${(18 / 20) * 251.2} 251.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold" style={{ color: '#2A3262' }}>18</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-1/2">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#4A47A3' }}>
                  Prefer words and text as an information obtaining method. They like presentation style, by text or writing
                </h3>
                
                <p className="mb-4 text-gray-700">
                  Students with the tendency of reading prefer printed word and text as a method to gain information. They like list, glossary, textbooks, lecture notes, or circulation. These students like to arrange lecture notes into sketch form, paraphrase classroom notes, and study multiple choice exam questions.
                </p>
                
                <p className="text-gray-700">
                  Besides that, students are note takers. They study better through note taken from lecture or from difficult reading materials.
                </p>
              </div>
            </div>
          </div>

          {/* Your Other Scores Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#4A47A3' }}>
              Your Other Scores
            </h2>
            
            <div className="space-y-6">
              <SmallChart score={10} name="Visual" color="#8B5CF6" />
              <SmallChart score={12} name="Auditory" color="#EF4444" />
              <SmallChart score={18} name="Reading" color="#06B6D4" />
            </div>
          </div>

          {/* Bottom Section: Get to know more in detail */}
          <div className="text-center py-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ color: '#4A47A3' }}>
              Get to know more in detail
            </h2>
            
            <div className="bg-white p-6 text-center border-2 shadow-md rounded-xl max-w-md mx-auto" style={{ borderColor: '#4A47A3' }}>
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                VARK Results + Report Certificate
              </h3>
              <p className="text-3xl font-extrabold mb-4" style={{ color: '#4A47A3' }}>Rp. 30.000</p>
              <button 
                className="w-full py-3 text-lg text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#4A47A3' }}
              >
                Get My Results
              </button>
              <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-medium">100% Secure</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 relative z-10" style={{ backgroundColor: '#212437' }}>
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

export default ResultsDashboard;