"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Lock, AlertCircle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { comprehensiveAPI } from '@/lib/api/comprehensive';
import { ComprehensiveTest, ComprehensiveTestResults as ComprehensiveTestResultsType } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

interface ResultsState {
  isLoading: boolean;
  testData: ComprehensiveTest | null;
  resultsData: ComprehensiveTestResultsType | null;
  error: string | null;
  canDownloadCertificate: boolean;
}

// Comprehensive categories - 5 specific dimensions with detailed descriptions
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
  position: 'absolute' as const,
  top: '-8px',
  right: '-8px',
  backgroundColor: '#fbbf24',
  color: '#000',
  fontSize: '10px',
  fontWeight: 'bold',
  padding: '4px 8px',
  borderRadius: '6px',
  transform: 'rotate(12deg)',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

/**
 * Enhanced Comprehensive Test Results Dashboard
 * Displays comprehensive assessment results combining VARK, AI Knowledge, and Behavioral
 */
const EnhancedComprehensiveResultsDashboard = () => {
  const { user } = useAuth();
  const [resultsState, setResultsState] = useState<ResultsState>({
    isLoading: true,
    testData: null,
    resultsData: null,
    error: null,
    canDownloadCertificate: false
  });

  const [isPaid, setIsPaid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentSuccessDialog, setShowPaymentSuccessDialog] = useState(false);

  const handlePurchaseCertificate = async () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsPaid(true);
      setShowPaymentSuccessDialog(true);
    }, 2000);
  };

  const handleDownloadCertificate = async () => {
    alert('Comprehensive certificate download would start here');
  };

  const loadResults = useCallback(async () => {
    if (!user) return;

    try {
      setResultsState(prev => ({ ...prev, isLoading: true, error: null }));
      const results = await comprehensiveAPI.getTestResults('latest');
      setResultsState(prev => ({
        ...prev,
        isLoading: false,
        resultsData: results.data,
        canDownloadCertificate: true
      }));
    } catch (error) {
      console.error('Failed to load results:', error);
      setResultsState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load results'
      }));
    }
  }, [user]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Create organized data for comprehensive categories - 5 dimensions
  const organizedScores = resultsState.resultsData ? Object.entries(COMPREHENSIVE_CATEGORIES).map(([code, info]) => {
    const score = (() => {
      switch (code) {
        case 'CF': return resultsState.resultsData!.cf_score;
        case 'R': return resultsState.resultsData!.r_score;
        case 'MA': return resultsState.resultsData!.ma_score;
        case 'AG': return resultsState.resultsData!.ag_score;
        case 'E': return resultsState.resultsData!.e_score;
        default: return 0;
      }
    })();

    const percentage = (score / resultsState.resultsData!.max_score) * 100;

    return {
      name: info.name,
      score,
      percentage,
      color: info.color,
      code
    };
  }) : [];

  if (resultsState.isLoading) {
    return (
      <div className="min-h-screen bg-[#E0E6F6] relative overflow-hidden">
        <Header currentPage="comprehensive-test-results" />
        <div className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your comprehensive results...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (resultsState.error || !resultsState.resultsData) {
    return (
      <div className="min-h-screen bg-[#E0E6F6] relative overflow-hidden">
        <Header currentPage="comprehensive-test-results" />
        <div className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Results</h2>
              <p className="text-gray-600 mb-6">
                {resultsState.error || 'No test results found. Please take the test first.'}
              </p>
              <Link
                href="/comprehensive-test"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Take Comprehensive Test
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0E6F6] relative overflow-hidden" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      <Header currentPage="comprehensive-test-results" />

      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-auto opacity-30 z-0 pointer-events-none">
        <div className="w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          {/* User Welcome Section */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Welcome back, {user?.name || 'Student'}!</h2>
                <p className="text-gray-600 text-sm sm:text-base">Here are your Comprehensive Assessment results</p>
              </div>
            </div>
          </div>

          {/* Top Section: Final Report */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#4A47A3' }}>
                Your comprehensive learning profile
              </h1>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm" style={{ color: '#4A47A3' }}>Certificate ID: COMP-{Date.now()}</p>
                <p className="text-xs text-gray-500">Test completed: {new Date().toLocaleDateString()}</p>
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
                {/* Comprehensive Category Descriptions - All 5 */}
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


                {/* Payment/Download Component */}
                <div className="mt-6 sm:mt-8">
                  {isPaid ? (
                    <button
                      className="w-full py-2 sm:py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
                      style={{ backgroundColor: '#4A47A3' }}
                      onClick={handleDownloadCertificate}
                    >
                      Download Comprehensive Certificate
                    </button>
                  ) : (
                    <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl w-full" style={{ borderColor: '#4A47A3' }}>
                      <div style={exclusiveBadgeStyle}>EXCLUSIVE</div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                        Complete Results + Certificate
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                        Get your complete comprehensive profile with detailed insights
                      </p>
                      <p className="text-2xl sm:text-3xl font-extrabold mb-4" style={{ color: '#4A47A3' }}>Rp. 50.000</p>
                      <button
                        onClick={handlePurchaseCertificate}
                        disabled={isProcessingPayment}
                        className="w-full py-2 sm:py-3 text-base sm:text-lg text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: '#4A47A3' }}
                      >
                        {isProcessingPayment ? 'Processing...' : 'Get Complete Results'}
                      </button>
                      <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
                        <Lock className="h-4 w-4" />
                        <span className="text-xs font-medium">100% Secure</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comprehensive Profile Section */}
          <div className="rounded-xl shadow-lg mb-6 sm:mb-12 bg-white p-4 sm:p-8 md:p-12">
            {!isPaid && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
                <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl max-w-sm w-full" style={{ borderColor: '#4A47A3' }}>
                  <div style={exclusiveBadgeStyle}>EXCLUSIVE</div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                    Unlock Complete Analysis
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    Get detailed insights across all assessment areas
                  </p>
                  <button
                    onClick={handlePurchaseCertificate}
                    disabled={isProcessingPayment}
                    className="w-full py-2 sm:py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: '#4A47A3' }}
                  >
                    {isProcessingPayment ? 'Processing...' : 'Unlock Results'}
                  </button>
                </div>
              </div>
            )}

            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: '#24348C' }}>
                Your Comprehensive Profile
              </h2>
              <p className="text-gray-600">
                {resultsState.resultsData?.result_description?.description ||
                'Your comprehensive assessment evaluates your cognitive flexibility, resilience, metacognitive awareness, academic grit, and self-esteem to create a complete psychological profile.'}
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
                Want to retake the comprehensive assessment?
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Your learning profile can evolve. Take the comprehensive assessment again to see changes.
              </p>
              <Link
                href="/comprehensive-test"
                className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm sm:text-base"
              >
                Take Test Again
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer className="relative z-10" />

      {/* Payment Success Dialog */}
      {showPaymentSuccessDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowPaymentSuccessDialog(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
            </div>
            <div className="px-6 py-6">
              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">🎉 Complete Access Unlocked!</h4>
                <p className="text-gray-600 text-sm">
                  You now have access to your complete comprehensive assessment results.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentSuccessDialog(false);
                    handleDownloadCertificate();
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium"
                >
                  Download Certificate
                </button>
                <button
                  onClick={() => setShowPaymentSuccessDialog(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium"
                >
                  Continue Reading
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedComprehensiveResultsDashboard;