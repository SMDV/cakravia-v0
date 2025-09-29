"use client"

import React from 'react';
import { Check, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import ApexCharts dynamically for client-side rendering
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

// Mock Behavioral Categories - 4 specific dimensions with detailed descriptions
const BEHAVIORAL_CATEGORIES = {
  H: {
    name: 'Kebiasaan (Habits)',
    description: 'Habits adalah kebiasaan, yaitu tindakan atau perilaku yang dilakukan secara berulang dan otomatis sehingga menjadi otomatis dan sering dilakukan tanpa banyak berpikir',
    color: '#8979FF'
  },
  M: {
    name: 'Motivasi (Motivation)',
    description: 'Motivasi adalah dorongan internal atau eksternal yang menyebabkan seseorang bertindak atau melakukan suatu kegiatan dengan tujuan tertentu, baik yang muncul secara sadar maupun tidak',
    color: '#FF928A'
  },
  R: {
    name: 'Regulasi Diri (Self-Regulation)',
    description: 'Self-regulation adalah kemampuan seseorang untuk mengatur pikiran, emosi, dan perilaku diri sendiri secara konsisten untuk mencapai tujuan jangka panjang',
    color: '#3CC3DF'
  },
  E: {
    name: 'Keterlibatan (Engagement)',
    description: 'Engagement adalah tingkat perhatian, rasa ingin tahu, dan komitmen aktif yang dibawa oleh peserta didik ke dalam proses pembelajaran, yang mencakup dimensi perilaku, kognitif, dan emosional',
    color: '#FFAE4C'
  }
};

// Mock results data - 4 dimensions plus average and level
const mockResultsData = {
  h_score: 4.2,
  m_score: 3.8,
  r_score: 4.5,
  e_score: 3.7,
  average_score: 4.05,
  level_label: 'Tinggi',
  min_score: 1.0,
  max_score: 5.0,
  total_score: 16.2,
  scores_breakdown: [
    { category: 'Kebiasaan', code: 'H', score: 4.2, percentage: 84 },
    { category: 'Motivasi', code: 'M', score: 3.8, percentage: 76 },
    { category: 'Regulasi Diri', code: 'R', score: 4.5, percentage: 90 },
    { category: 'Keterlibatan', code: 'E', score: 3.7, percentage: 74 }
  ],
  dominant_dimensions: ['R', 'H'],
  dimension_interpretations: {
    H: 'Skor tinggi menunjukkan kebiasaan belajar yang sangat baik dan konsisten',
    M: 'Motivasi yang baik dengan ruang untuk peningkatan lebih lanjut',
    R: 'Kemampuan regulasi diri yang sangat baik dalam mengelola pembelajaran',
    E: 'Keterlibatan yang solid dengan potensi untuk ditingkatkan'
  },
  result_description: {
    title: 'Profil Pembelajar Mandiri',
    description: 'Anda menunjukkan profil pembelajaran yang sangat mandiri dengan kekuatan utama dalam regulasi diri dan kebiasaan belajar. Kemampuan Anda dalam mengatur dan mengontrol proses pembelajaran sangat baik, didukung oleh kebiasaan belajar yang konsisten.',
    recommendations: 'Fokuskan pada peningkatan keterlibatan aktif dalam pembelajaran sambil mempertahankan kekuatan Anda dalam regulasi diri. Kembangkan strategi untuk meningkatkan motivasi intrinsik agar mencapai potensi penuh.',
    behavioral_profile: 'Pembelajar Mandiri'
  }
};

const mockBadgeStyle = {
  position: 'absolute' as const,
  top: '-8px',
  right: '-8px',
  backgroundColor: '#10B981',
  color: '#fff',
  fontSize: '10px',
  fontWeight: 'bold',
  padding: '4px 8px',
  borderRadius: '6px',
  transform: 'rotate(12deg)',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

/**
 * Mock Behavioral Test Results Page
 * Provides a preview of behavioral assessment results for development and testing
 */
const BehavioralTestResultsMock = () => {
  const { user } = useAuth();

  // Create organized scores from mock data - 4 dimensions
  const organizedScores = Object.entries(BEHAVIORAL_CATEGORIES).map(([code, info]) => {
    const score = (() => {
      switch (code) {
        case 'H': return mockResultsData.h_score;
        case 'M': return mockResultsData.m_score;
        case 'R': return mockResultsData.r_score;
        case 'E': return mockResultsData.e_score;
        default: return 0;
      }
    })();

    const percentage = (score / mockResultsData.max_score) * 100;

    return {
      name: info.name,
      score,
      percentage,
      color: info.color,
      code
    };
  });

  // SmallScoreBox Component for Behavioral Test
  const SmallScoreBox = ({ score, name, color, code }: { score: number; name: string; color: string; code: string }) => {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 w-full aspect-[3/4]">
        <div
          className="text-white text-center font-bold text-sm sm:text-base leading-tight h-1/3 flex items-center justify-center px-2"
          style={{ backgroundColor: color }}
        >
          {name} ({code})
        </div>
        <div className="p-4 sm:p-6 text-center bg-gray-50 h-2/3 flex flex-col justify-center">
          <div className="text-3xl sm:text-4xl font-bold mb-1 sm:mb-2" style={{ color: '#24348C' }}>
            {score.toFixed(1)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            Score
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#E0E6F6] relative overflow-hidden" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="behavioral-test-results-mock" />

      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-auto opacity-30 z-0 pointer-events-none">
        <div className="w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-full h-auto opacity-50 z-0 pointer-events-none">
        <div className="w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-green-400 to-blue-400 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          {/* Mock Banner */}
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-center">
            <strong>MOCK RESULTS:</strong> This is a preview of behavioral test results for development purposes
          </div>

          {/* User Welcome Section */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Welcome back, {user?.name || 'Student'}!</h2>
                <p className="text-gray-600 text-sm sm:text-base">Here are your Behavioral Assessment results (Mock)</p>
              </div>
            </div>
          </div>

          {/* Top Section: Final Report */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#4A47A3' }}>
                Your Behavioral Profile
              </h1>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm" style={{ color: '#4A47A3' }}>Certificate ID: BEH-MOCK-{Date.now()}</p>
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
                      Behavioral Profile
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
                            toolbar: {
                              show: false,
                            },
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
                                name: {
                                  show: false,
                                },
                                value: {
                                  show: false,
                                }
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
                                chart: {
                                  height: 300,
                                },
                                legend: {
                                  offsetX: 20,
                                },
                              },
                            },
                            {
                              breakpoint: 480,
                              options: {
                                chart: {
                                  height: 250,
                                },
                                legend: {
                                  offsetX: 10,
                                },
                              },
                            },
                          ]
                        }}
                        series={organizedScores.map(item => item.percentage)}
                        type="radialBar"
                        height={350}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Descriptions Section */}
              <div className="w-full lg:w-1/2 space-y-4 sm:space-y-6">
                {/* Behavioral Category Descriptions */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {organizedScores.map((category) => (
                    <div key={category.code} className="flex items-start gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" style={{ color: '#8BC34A' }} />
                      <div>
                        <h3 className="font-bold mb-2 text-sm sm:text-base" style={{ color: '#2A3262' }}>
                          {category.name} ({category.code}) - {category.score.toFixed(1)}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-700">
                          {BEHAVIORAL_CATEGORIES[category.code as keyof typeof BEHAVIORAL_CATEGORIES]?.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mock Payment Component */}
                <div className="mt-6 sm:mt-8">
                  <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl w-full" style={{ borderColor: '#4A47A3' }}>
                    <div style={mockBadgeStyle}>MOCK</div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                      Behavioral Results + Certificate
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                      This is a mock preview of the paid behavioral results
                    </p>
                    <p className="text-2xl sm:text-3xl font-extrabold mb-4" style={{ color: '#4A47A3' }}>Rp. 30.000</p>
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

          {/* Behavioral Profile Section */}
          <div className="rounded-xl shadow-lg mb-6 sm:mb-12 relative overflow-hidden" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
            <div className="bg-white p-4 sm:p-8 md:p-12">
              {/* Header */}
              <div className="text-center mb-8 sm:mb-12">
                <div
                  className="max-w-2xl mx-auto py-6 sm:py-8"
                  style={{
                    borderTop: '3px solid #24348C',
                    borderBottom: '3px solid #24348C',
                    padding: '2rem 0'
                  }}
                >
                  <h2
                    className="text-sm sm:text-base font-medium mb-3 sm:mb-4"
                    style={{
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      marginTop: 0
                    }}
                  >
                    Your Behavioral Profile
                  </h2>
                  <h3
                    className="text-3xl sm:text-4xl md:text-5xl font-bold italic leading-tight mb-3 sm:mb-4"
                    style={{
                      color: '#24348C',
                      lineHeight: '1.2',
                      margin: 0
                    }}
                  >
                    {mockResultsData.result_description.title}
                  </h3>
                  <div
                    className="w-16 h-0.5 mx-auto"
                    style={{
                      background: '#fbbf24',
                      marginTop: '1rem'
                    }}
                  ></div>
                </div>
              </div>

              {/* Score Cards - 4 Behavioral Dimensions */}
              <div className="mb-6 sm:mb-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {organizedScores.map((scoreData) => (
                  <div key={scoreData.code} className="w-full h-full">
                    <SmallScoreBox
                      score={scoreData.score}
                      name={scoreData.name}
                      color={scoreData.color}
                      code={scoreData.code}
                    />
                  </div>
                ))}
              </div>

              {/* Average Score Card - Highlighted Below */}
              <div className="mb-8 sm:mb-12 flex justify-center">
                <div className="w-full max-w-md">
                  <div className="bg-white rounded-xl overflow-hidden shadow-xl border-2 border-purple-200">
                    <div
                      className="text-white text-center font-bold text-lg sm:text-xl leading-tight py-4 sm:py-6"
                      style={{ backgroundColor: '#6B46C1' }}
                    >
                      Skor Rata-rata (Average Score)
                    </div>
                    <div className="p-6 sm:p-8 text-center bg-gradient-to-br from-purple-50 to-purple-100">
                      <div className="text-5xl sm:text-6xl font-bold mb-3 sm:mb-4" style={{ color: '#24348C' }}>
                        {mockResultsData.average_score.toFixed(1)}
                      </div>
                      <div className="text-sm sm:text-base text-gray-600 mb-3">
                        Skor Keseluruhan
                      </div>
                      <div className="text-lg sm:text-xl font-bold px-4 py-2 rounded-lg" style={{ backgroundColor: '#6B46C1', color: 'white' }}>
                        {mockResultsData.level_label}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Card */}
              <div className="mb-6 sm:mb-8">
                <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#F4F4F4EE' }}>
                  <div className="p-4 sm:p-6">
                    <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#5E5E5E' }}>
                      Behavioral Profile Description
                    </h4>
                    <div className="w-full h-0.5 bg-gray-300 mb-3 sm:mb-4"></div>
                    <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#5E5E5E' }}>
                      {mockResultsData.result_description.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations Card */}
              <div className="mb-6 sm:mb-8">
                <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#DFE4FF' }}>
                  <div className="p-4 sm:p-6">
                    <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#24348C' }}>
                      Behavioral Development Recommendations
                    </h4>
                    <div className="w-full h-0.5 mb-3 sm:mb-4" style={{ backgroundColor: '#24348C40' }}></div>
                    <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#24348CCC' }}>
                      {mockResultsData.result_description.recommendations}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Again Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#4A47A3' }}>
                Ready to take the real behavioral assessment?
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                This was just a preview. Take the actual assessment to get your real behavioral profile.
              </p>
              <Link
                href="/behavioral-test"
                className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm sm:text-base"
              >
                Take Real Assessment
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer className="relative z-10" />
    </div>
  );
};

export default BehavioralTestResultsMock;