"use client"

import React, { useState } from 'react';
import { Lock, User, Brain, Calculator, Shapes, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import ApexCharts dynamically for client-side rendering
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

// Mock TPA test results data
const MOCK_TPA_RESULTS = {
  analytical_reasoning_score: 17.5,
  quantitative_reasoning_score: 19.2,
  spatial_reasoning_score: 15.8,
  verbal_reasoning_score: 18.3,
  total_score: 70.8,
  average_score: 17.7,
  min_score: 0,
  max_score: 20,
  dominant_reasoning_categories: ["Quantitative Reasoning", "Verbal Reasoning"],
  detailed_analysis: {
    analytical_reasoning: {
      score: 17.5,
      percentile: 85,
      interpretation: "Strong analytical thinking abilities with excellent pattern recognition and logical deduction skills. You can effectively break down complex problems into manageable components.",
      strengths: ["Pattern recognition", "Logical deduction", "Problem decomposition"],
      areas_for_improvement: ["Speed of analysis", "Handling ambiguous information"]
    },
    quantitative_reasoning: {
      score: 19.2,
      percentile: 95,
      interpretation: "Exceptional mathematical reasoning and numerical analysis capabilities. You demonstrate superior skills in working with quantitative data and mathematical relationships.",
      strengths: ["Mathematical computation", "Data interpretation", "Numerical pattern recognition"],
      areas_for_improvement: ["Complex statistical concepts", "Applied mathematics in real-world scenarios"]
    },
    spatial_reasoning: {
      score: 15.8,
      percentile: 70,
      interpretation: "Above-average spatial visualization abilities with good capacity for mental rotation and 3D thinking. Room for improvement in complex spatial transformations.",
      strengths: ["Basic spatial visualization", "2D pattern recognition"],
      areas_for_improvement: ["3D mental rotation", "Complex spatial transformations", "Multi-step spatial reasoning"]
    },
    verbal_reasoning: {
      score: 18.3,
      percentile: 90,
      interpretation: "Excellent verbal reasoning and language comprehension skills. You show strong abilities in understanding complex texts and drawing logical conclusions from written information.",
      strengths: ["Reading comprehension", "Vocabulary usage", "Verbal analogies"],
      areas_for_improvement: ["Abstract verbal concepts", "Complex argumentative reasoning"]
    }
  }
};

// TPA Reasoning Categories with icons and colors
const TPA_CATEGORIES = {
  'Analytical Reasoning': {
    name: 'Analytical Reasoning',
    code: 'AR',
    description: 'Ability to break down complex problems into parts, identify patterns, and draw logical conclusions through systematic analysis',
    color: '#8979FF',
    icon: Brain
  },
  'Quantitative Reasoning': {
    name: 'Quantitative Reasoning',
    code: 'QR',
    description: 'Mathematical problem-solving skills, numerical analysis, and the ability to work with quantitative data and relationships',
    color: '#FF928A',
    icon: Calculator
  },
  'Spatial Reasoning': {
    name: 'Spatial Reasoning',
    code: 'SR',
    description: 'Ability to visualize, manipulate, and understand spatial relationships between objects in two and three dimensions',
    color: '#3CC3DF',
    icon: Shapes
  },
  'Verbal Reasoning': {
    name: 'Verbal Reasoning',
    code: 'VR',
    description: 'Language comprehension, logical thinking with words, and the ability to understand and analyze written information',
    color: '#FFAE4C',
    icon: MessageCircle
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

// Mock TPA Reasoning Style Section Component
const MockTpaReasoningStyleSection = ({ isPaid, handlePurchaseCertificate, isProcessingPayment, organizedScores }: {
  isPaid: boolean;
  handlePurchaseCertificate: () => void;
  isProcessingPayment: boolean;
  organizedScores: Array<{
    name: string;
    score: number;
    percentage: number;
    color: string;
    code: string;
  }>;
}) => {
  const { detailed_analysis } = MOCK_TPA_RESULTS;

  // SmallScoreBox Component for TPA Test
  const SmallScoreBox = ({ score, name, color, code, icon: Icon }: {
    score: number;
    name: string;
    color: string;
    code: string;
    icon: React.ElementType;
  }) => {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 w-full aspect-[3/4]">
        <div
          className="text-white text-center font-bold text-sm sm:text-base leading-tight h-1/3 flex items-center justify-center px-2"
          style={{ backgroundColor: color }}
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span className="text-xs">{name} ({code})</span>
          </div>
        </div>
        <div className="p-4 sm:p-6 text-center bg-gray-50 h-2/3 flex flex-col justify-center">
          <div className="text-3xl sm:text-4xl font-bold mb-1 sm:mb-2" style={{ color: '#24348C' }}>
            {score?.toFixed(1) || '0.0'}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            Score
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-xl shadow-lg mb-6 sm:mb-12 relative overflow-hidden ${!isPaid ? 'overflow-hidden' : ''}`} style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Magazine-style Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(45deg, #fef3c7, #fed7aa)',
          borderRadius: '50%',
          opacity: 0.3
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '-50px',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(45deg, #dbeafe, #c7d2fe)',
          borderRadius: '50%',
          opacity: 0.4
        }}></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 bg-white p-4 sm:p-8 md:p-12">
        {/* Blur overlay for locked content */}
        {!isPaid && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
            <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl max-w-sm w-full" style={{ borderColor: '#4A47A3' }}>
              <div style={mockBadgeStyle}>MOCK</div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                TPA Reasoning Results + Certificate
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                Get your comprehensive reasoning profile with detailed analysis!
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold mb-4" style={{ color: '#4A47A3' }}>Rp. 35.000</p>
              <button
                onClick={handlePurchaseCertificate}
                disabled={isProcessingPayment}
                className="w-full py-2 sm:py-3 text-base sm:text-lg text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#4A47A3' }}
              >
                {isProcessingPayment ? 'Processing...' : 'Get Mock Results'}
              </button>
              <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-medium">100% Secure</span>
              </div>
            </div>
          </div>
        )}

        {/* Magazine-style Header */}
        <div className="text-center mb-8 sm:mb-12 relative z-10">
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
              Your Reasoning Profile (Mock)
            </h2>
            <h3
              className="text-3xl sm:text-4xl md:text-5xl font-bold italic leading-tight mb-3 sm:mb-4"
              style={{
                color: '#24348C',
                lineHeight: '1.2',
                margin: 0
              }}
            >
              Comprehensive Reasoning Assessment
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

        {/* Score Cards - 4 Reasoning Dimensions */}
        <div className="mb-6 sm:mb-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {organizedScores.map((scoreData) => {
            const categoryInfo = TPA_CATEGORIES[scoreData.name as keyof typeof TPA_CATEGORIES];
            return (
              <div key={scoreData.code} className="w-full h-full">
                <SmallScoreBox
                  score={scoreData.score}
                  name={scoreData.name}
                  color={scoreData.color || '#4A47A3'}
                  code={scoreData.code}
                  icon={categoryInfo?.icon || Brain}
                />
              </div>
            );
          })}
        </div>

        {/* Average Score Card */}
        <div className="mb-8 sm:mb-12 flex justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl overflow-hidden shadow-xl border-2 border-purple-200">
              <div
                className="text-white text-center font-bold text-lg sm:text-xl leading-tight py-4 sm:py-6"
                style={{ backgroundColor: '#6B46C1' }}
              >
                Total Reasoning Score (Mock)
              </div>
              <div className="p-6 sm:p-8 text-center bg-gradient-to-br from-purple-50 to-purple-100">
                <div className="text-5xl sm:text-6xl font-bold mb-3 sm:mb-4" style={{ color: '#24348C' }}>
                  {MOCK_TPA_RESULTS.total_score.toFixed(1)}
                </div>
                <div className="text-sm sm:text-base text-gray-600 mb-3">
                  Total Score
                </div>
                <div className="text-lg sm:text-xl font-bold px-4 py-2 rounded-lg" style={{ backgroundColor: '#6B46C1', color: 'white' }}>
                  {MOCK_TPA_RESULTS.dominant_reasoning_categories[0]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reasoning Profile Description Card */}
        <div className="mb-6 sm:mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#F4F4F4EE' }}>
            <div className="p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#5E5E5E' }}>
                Detailed Analysis (Mock)
              </h4>
              <div className="w-full h-0.5 bg-gray-300 mb-3 sm:mb-4"></div>
              <div className="space-y-4">
                {Object.entries(detailed_analysis).map(([key, analysis]) => {
                  const categoryName = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <div key={key} className="border-l-4 pl-4" style={{ borderColor: TPA_CATEGORIES[categoryName as keyof typeof TPA_CATEGORIES]?.color || '#4A47A3' }}>
                      <h5 className="font-bold text-sm sm:text-base mb-2" style={{ color: '#24348C' }}>
                        {categoryName} (Score: {analysis.score}/20, {analysis.percentile}th percentile)
                      </h5>
                      <p className="text-xs sm:text-sm mb-2 leading-relaxed" style={{ color: '#5E5E5E' }}>
                        {analysis.interpretation}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-semibold text-green-700">Strengths:</span>
                          <ul className="list-disc list-inside ml-2 text-green-600">
                            {analysis.strengths.map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold text-orange-700">Areas for Improvement:</span>
                          <ul className="list-disc list-inside ml-2 text-orange-600">
                            {analysis.areas_for_improvement.map((area, idx) => (
                              <li key={idx}>{area}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Reasoning Development Recommendations Card */}
        <div className="mb-6 sm:mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#DFE4FF' }}>
            <div className="p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#24348C' }}>
                Overall Development Summary (Mock)
              </h4>
              <div className="w-full h-0.5 mb-3 sm:mb-4" style={{ backgroundColor: '#24348C40' }}></div>
              <div className="text-sm sm:text-base leading-relaxed" style={{ color: '#24348CCC' }}>
                <p className="mb-3">
                  Based on your TPA reasoning assessment, you demonstrate particularly strong capabilities in {MOCK_TPA_RESULTS.dominant_reasoning_categories.join(' and ')},
                  with a total score of {MOCK_TPA_RESULTS.total_score} out of 80 points.
                </p>
                <p>
                  Your comprehensive reasoning profile shows balanced cognitive abilities across multiple dimensions,
                  with opportunities for targeted development in areas identified in the detailed analysis above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Enhanced TPA Test Results Mock Dashboard
 */
const EnhancedTpaResultsMockDashboard = () => {
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handlePurchaseCertificate = () => {
    setIsProcessingPayment(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsPaid(true);
      alert('Mock payment successful! In a real scenario, this would unlock the full results.');
    }, 2000);
  };

  const handleDownloadCertificate = () => {
    alert('Mock certificate download would start here');
  };

  // Create organized data for TPA reasoning categories
  const organizedScores = Object.entries(TPA_CATEGORIES).map(([categoryName, info]) => {
    const score = (() => {
      switch (categoryName) {
        case 'Analytical Reasoning': return MOCK_TPA_RESULTS.analytical_reasoning_score;
        case 'Quantitative Reasoning': return MOCK_TPA_RESULTS.quantitative_reasoning_score;
        case 'Spatial Reasoning': return MOCK_TPA_RESULTS.spatial_reasoning_score;
        case 'Verbal Reasoning': return MOCK_TPA_RESULTS.verbal_reasoning_score;
        default: return 0;
      }
    })();

    const maxScore = MOCK_TPA_RESULTS.max_score;
    const percentage = (score / maxScore) * 100;

    return {
      name: info.name,
      score,
      percentage,
      color: info.color,
      code: info.code
    };
  });

  return (
    <div className="min-h-screen bg-[#E0E6F6] relative overflow-hidden" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="tpa-test-results-mock" />

      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-auto opacity-30 z-0 pointer-events-none">
        <div className="w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-full h-auto opacity-50 z-0 pointer-events-none">
        <div className="w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-green-400 to-blue-400 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          {/* User Welcome Section */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">TPA Assessment Mock Results</h2>
                <p className="text-gray-600 text-sm sm:text-base">Here are your sample TPA reasoning results</p>
              </div>
            </div>
          </div>

          {/* Top Section: Final Report */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#4A47A3' }}>
                TPA Reasoning Profile Report (Mock)
              </h1>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm" style={{ color: '#4A47A3' }}>Certificate ID: TPA-MOCK-{Date.now()}</p>
                <p className="text-xs text-gray-500">Mock completed: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Main content: Responsive Layout */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
              {/* Chart Section - TPA-style Radar Chart */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <Card className="rounded-lg overflow-hidden border-none shadow-lg w-full">
                  <CardHeader className="bg-[#8BC34A] text-white rounded-t-lg py-3 sm:py-4">
                    <CardTitle className="text-center text-lg sm:text-2xl font-bold" style={{ color: '#24348C' }}>
                      Reasoning Profile (Mock)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 bg-[#F0F2F5]">
                    {/* ApexCharts Bar Chart */}
                    {typeof window !== 'undefined' && (
                      <ApexCharts
                        options={{
                          chart: {
                            height: 350,
                            type: "bar",
                            toolbar: {
                              show: false,
                            },
                            fontFamily: 'Merriweather Sans, sans-serif'
                          },
                          plotOptions: {
                            bar: {
                              borderRadius: 4,
                              horizontal: false,
                              columnWidth: '60%',
                              dataLabels: {
                                position: 'top'
                              }
                            }
                          },
                          colors: organizedScores.map(item => item.color),
                          dataLabels: {
                            enabled: true,
                            offsetY: -20,
                            style: {
                              fontSize: '12px',
                              colors: ['#333']
                            },
                            formatter: function(val: number) {
                              return val.toFixed(1)
                            }
                          },
                          tooltip: {
                            y: {
                              formatter: function(val: number) {
                                return val.toFixed(1) + '/20'
                              }
                            }
                          },
                          xaxis: {
                            categories: organizedScores.map(item => item.code),
                            labels: {
                              style: {
                                colors: "#888",
                                fontSize: "12px"
                              }
                            }
                          },
                          yaxis: {
                            min: 0,
                            max: 20,
                            labels: {
                              style: {
                                colors: "#888",
                                fontSize: "11px"
                              }
                            },
                            title: {
                              text: 'Score',
                              style: {
                                color: '#888'
                              }
                            }
                          },
                          grid: {
                            borderColor: '#e9e9e9',
                            strokeDashArray: 0
                          }
                        }}
                        series={[{
                          name: 'Reasoning Scores (Mock)',
                          data: organizedScores.map(item => item.score)
                        }]}
                        type="bar"
                        height={350}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Descriptions Section */}
              <div className="w-full lg:w-1/2 space-y-4 sm:space-y-6">
                {/* TPA Category Descriptions */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {organizedScores.map((category) => {
                    const categoryInfo = TPA_CATEGORIES[category.name as keyof typeof TPA_CATEGORIES];
                    const Icon = categoryInfo?.icon || Brain;
                    return (
                      <div key={category.code} className="flex items-start gap-3">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" style={{ color: '#8BC34A' }} />
                        <div>
                          <h3 className="font-bold mb-2 text-sm sm:text-base" style={{ color: '#2A3262' }}>
                            {category.name} ({category.code}): {category.score}/20
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-700">
                            {categoryInfo?.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Payment/Download Component */}
                <div className="mt-6 sm:mt-8">
                  {isPaid ? (
                    <button
                      className="w-full py-2 sm:py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
                      style={{ backgroundColor: '#4A47A3' }}
                      onClick={handleDownloadCertificate}
                    >
                      Download Mock TPA Certificate
                    </button>
                  ) : (
                    <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl w-full" style={{ borderColor: '#4A47A3' }}>
                      <div style={mockBadgeStyle}>MOCK</div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                        TPA Results + Certificate
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                        Get your exclusive reasoning profile with expert cognitive analysis
                      </p>
                      <p className="text-2xl sm:text-3xl font-extrabold mb-4" style={{ color: '#4A47A3' }}>Rp. 35.000</p>
                      <button
                        onClick={handlePurchaseCertificate}
                        disabled={isProcessingPayment}
                        className="w-full py-2 sm:py-3 text-base sm:text-lg text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: '#4A47A3' }}
                      >
                        {isProcessingPayment ? 'Processing...' : 'Get Mock Results'}
                      </button>
                      <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
                        <Lock className="h-4 w-4" />
                        <span className="text-xs font-medium">100% Secure (Mock)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TPA Reasoning Style Section */}
          <MockTpaReasoningStyleSection
            isPaid={isPaid}
            handlePurchaseCertificate={handlePurchaseCertificate}
            isProcessingPayment={isProcessingPayment}
            organizedScores={organizedScores}
          />

          {/* Test Again Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#4A47A3' }}>
                Try the actual TPA assessment
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                This was a mock demonstration. Take the real TPA test to get your authentic reasoning profile.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/tpa-test-mock"
                  className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium text-sm sm:text-base"
                >
                  Try Mock Again
                </Link>
                <Link
                  href="/tpa-test"
                  className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm sm:text-base"
                >
                  Take Real TPA Test
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer className="relative z-10" />
    </div>
  );
};

export default EnhancedTpaResultsMockDashboard;