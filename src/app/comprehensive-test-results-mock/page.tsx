"use client"

import React from 'react';
import { Check, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

// Mock comprehensive results data - 5 specific dimensions
const mockResultsData = {
  cf_score: 4.3, // Cognitive Flexibility
  r_score: 3.9,  // Resilience
  ma_score: 4.1, // Metacognitive Awareness
  ag_score: 3.7, // Academic Grit
  e_score: 4.0,  // Self-Esteem
  average_score: 4.0,
  level_label: 'Tinggi',
  min_score: 1.0,
  max_score: 5.0,
  total_score: 20.0,
  result_description: {
    title: 'Profil Komprehensif Seimbang',
    description: 'Anda menunjukkan profil psikologis yang sangat seimbang dengan kekuatan utama dalam fleksibilitas kognitif dan kesadaran metakognitif. Kemampuan adaptasi dan refleksi diri Anda sangat baik, didukung oleh resiliensi yang solid dan harga diri yang positif.',
    comprehensive_profile: 'Pembelajar Adaptif dan Reflektif'
  }
};

const COMPREHENSIVE_CATEGORIES = {
  CF: {
    name: 'Fleksibilitas Kognitif (CF)',
    description: 'Cognitive Flexibility adalah kemampuan mental untuk mengubah cara berpikir dan beradaptasi dengan situasi baru',
    color: '#8979FF'
  },
  R: {
    name: 'Resiliensi (R)',
    description: 'Resilience adalah kemampuan individu untuk beradaptasi, pulih, dan bangkit dari kesulitan, tantangan, atau trauma, serta tumbuh setelah mengalami masa sulit',
    color: '#FF928A'
  },
  MA: {
    name: 'Kesadaran Metakognitif (MA)',
    description: 'Metacognitive awareness adalah kesadaran seseorang akan cara berpikir dan proses belajarnya sendiri, termasuk pemahaman tentang bagaimana ia belajar, memantau prosesnya, dan mengendalikan proses tersebut agar menjadi lebih efektif',
    color: '#3CC3DF'
  },
  AG: {
    name: 'Keteguhan Akademik (AG)',
    description: 'Academic grit adalah sifat yang mencakup tekad, ketahanan, dan fokus yang tinggi dalam upaya mencapai tujuan jangka panjang dan menantang',
    color: '#FFAE4C'
  },
  E: {
    name: 'Harga Diri (E)',
    description: 'Self-esteem adalah penilaian subjektif tentang nilai dan kualitas dirinya sendiri, baik dalam keadaan positif maupun negatif',
    color: '#6366F1'
  }
};

const exclusiveBadgeStyle = {
  position: 'absolute' as const, top: '-8px', right: '-8px', backgroundColor: '#fbbf24', color: '#000',
  fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', transform: 'rotate(12deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

/**
 * Mock Comprehensive Test Results Page
 */
const ComprehensiveTestResultsMock = () => {
  const { user } = useAuth();

  const organizedScores = Object.entries(COMPREHENSIVE_CATEGORIES).map(([code, info]) => {
    const score = (() => {
      switch (code) {
        case 'CF': return mockResultsData.cf_score;
        case 'R': return mockResultsData.r_score;
        case 'MA': return mockResultsData.ma_score;
        case 'AG': return mockResultsData.ag_score;
        case 'E': return mockResultsData.e_score;
        default: return 0;
      }
    })();
    return { name: info.name, score, percentage: (score / mockResultsData.max_score) * 100, color: info.color, code };
  });

  return (
    <div className="min-h-screen bg-[#E0E6F6] relative overflow-hidden" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      <Header currentPage="comprehensive-test-results-mock" />

      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-auto opacity-30 z-0 pointer-events-none">
        <div className="w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          {/* Mock Banner */}
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-center">
            <strong>MOCK RESULTS:</strong> This is a preview of comprehensive test results for development purposes
          </div>

          {/* User Welcome Section */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Welcome back, {user?.name || 'Student'}!</h2>
                <p className="text-gray-600 text-sm sm:text-base">Here are your Comprehensive Assessment results (Mock)</p>
              </div>
            </div>
          </div>

          {/* Top Section: Final Report */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#4A47A3' }}>
                Your Comprehensive Profile
              </h1>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm" style={{ color: '#4A47A3' }}>Certificate ID: COMP-MOCK-{Date.now()}</p>
                <p className="text-xs text-gray-500">Mock results generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Main content: Responsive Layout */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
              {/* Chart Section - VARK-style Radial Bar Chart */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <Card className="rounded-lg overflow-hidden border-none shadow-lg w-full">
                  <CardHeader className="bg-[#8BC34A] text-white rounded-t-lg py-3 sm:py-4">
                    <CardTitle className="text-center text-lg sm:text-2xl font-bold" style={{ color: '#24348C' }}>
                      Comprehensive Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 bg-[#F0F2F5]">
                    {/* ApexCharts Radial Bar Chart - VARK Style */}
                    {typeof window !== 'undefined' && (
                      <ApexCharts
                        options={{
                          chart: {
                            height: 350,
                            type: "radialBar",
                            toolbar: { show: false },
                            fontFamily: 'Merriweather Sans, sans-serif'
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
                              track: {
                                background: '#E5E7EB',
                                strokeWidth: '100%',
                                margin: 5,
                              },
                              dataLabels: {
                                name: { show: false },
                                value: { show: false }
                              },
                              barLabels: {
                                enabled: true,
                                useSeriesColors: true,
                                offsetX: -8,
                                fontSize: "14px",
                                formatter: (seriesName: string, opts: { w: { globals: { series: number[] } }; seriesIndex: number }) =>
                                  seriesName + ":  " + opts.w.globals.series[opts.seriesIndex] + "%",
                              }
                            }
                          },
                          colors: organizedScores.map(item => item.color),
                          labels: organizedScores.map(item => item.code),
                          legend: {
                            show: false,
                          },
                          responsive: [
                            {
                              breakpoint: 768,
                              options: {
                                chart: { height: 300 },
                                legend: { offsetX: 20 }
                              }
                            },
                            {
                              breakpoint: 480,
                              options: {
                                chart: { height: 250 },
                                legend: { offsetX: 10 }
                              }
                            }
                          ]
                        }}
                        series={organizedScores.map(item => item.percentage)}
                        type="radialBar" height={350}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Descriptions Section */}
              <div className="w-full lg:w-1/2 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {organizedScores.map((category) => (
                    <div key={category.code} className="flex items-start gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" style={{ color: '#8BC34A' }} />
                      <div>
                        <h3 className="font-bold mb-2 text-sm sm:text-base" style={{ color: '#2A3262' }}>
                          {category.name} ({category.code})
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-700">
                          {COMPREHENSIVE_CATEGORIES[category.code as keyof typeof COMPREHENSIVE_CATEGORIES]?.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>


                {/* Mock Payment Component */}
                <div className="mt-6 sm:mt-8">
                  <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl w-full" style={{ borderColor: '#4A47A3' }}>
                    <div style={exclusiveBadgeStyle}>MOCK</div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                      Complete Results + Certificate
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                      This is a mock preview of the paid comprehensive results
                    </p>
                    <p className="text-2xl sm:text-3xl font-extrabold mb-4" style={{ color: '#4A47A3' }}>Rp. 50.000</p>
                    <button
                      disabled
                      className="w-full py-2 sm:py-3 text-base sm:text-lg text-white font-medium rounded-lg opacity-50 cursor-not-allowed"
                      style={{ backgroundColor: '#4A47A3' }}
                    >
                      Mock Preview Only
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comprehensive Profile Section */}
          <div className="rounded-xl shadow-lg mb-6 sm:mb-12 bg-white p-4 sm:p-8 md:p-12">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: '#24348C' }}>
                Your Comprehensive Profile
              </h2>
              <p className="text-gray-600">
                {mockResultsData.result_description.description}
              </p>
            </div>

            {/* Summary Cards - Score Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {organizedScores.map((category) => (
                <div key={category.code} className="bg-white p-4 rounded-xl shadow-lg border-l-4" style={{ borderLeftColor: category.color }}>
                  <h3 className="font-bold text-sm mb-1" style={{ color: category.color }}>
                    {category.code}
                  </h3>
                  <p className="text-2xl font-bold mb-1" style={{ color: '#24348C' }}>
                    {category.score.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {category.name.split(' ')[0]} {/* First word only */}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Test Again Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-12">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#4A47A3' }}>
                Ready to take the real comprehensive assessment?
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                This was just a preview. Take the actual comprehensive assessment to get your real profile.
              </p>
              <Link
                href="/comprehensive-test"
                className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm sm:text-base"
              >
                Take Real Assessment
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer className="relative z-10" />
    </div>
  );
};

export default ComprehensiveTestResultsMock;