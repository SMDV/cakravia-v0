"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Check, AlertCircle, User, BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { aiKnowledgeAPI } from '@/lib/api/aiKnowledge';
import { AiKnowledgeTest, AiKnowledgeTestResults } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import ApexCharts dynamically for client-side rendering
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

interface ResultsState {
  isLoading: boolean;
  testData: AiKnowledgeTest | null;
  resultsData: AiKnowledgeTestResults | null;
  error: string | null;
}

// Category mapping for display
const AI_KNOWLEDGE_CATEGORIES = {
  PE: {
    name: 'Performance Expectancy',
    description: 'How much you believe AI will enhance your academic performance',
    color: '#3B82F6'
  },
  EE: {
    name: 'Effort Expectancy',
    description: 'How easy you find it to use AI tools for learning',
    color: '#10B981'
  },
  SI: {
    name: 'Social Influence',
    description: 'How much social factors encourage your AI usage',
    color: '#F59E0B'
  },
  FC: {
    name: 'Facilitating Conditions',
    description: 'How well your environment supports AI usage',
    color: '#EF4444'
  },
  HM: {
    name: 'Hedonic Motivation',
    description: 'How much you enjoy using AI for learning',
    color: '#8B5CF6'
  },
  PV: {
    name: 'Price Value',
    description: 'How worthwhile you find the cost-benefit of AI',
    color: '#06B6D4'
  },
  HT: {
    name: 'Habit',
    description: 'How much AI usage has become automatic for you',
    color: '#84CC16'
  },
  BI: {
    name: 'Behavioral Intention',
    description: 'Your intention to continue using AI in the future',
    color: '#F97316'
  }
};

const AiKnowledgeTestResults = () => {
  const { isAuthenticated, user } = useAuth();
  const [resultsState, setResultsState] = useState<ResultsState>({
    isLoading: true,
    testData: null,
    resultsData: null,
    error: null
  });

  // Initialize results data
  const initializeResults = useCallback(async () => {
    if (!isAuthenticated) {
      setResultsState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Please login to view your AI Knowledge test results'
      }));
      return;
    }

    try {
      // Get test ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const testId = urlParams.get('testId');

      if (!testId) {
        throw new Error('Test ID not found in URL parameters');
      }

      // Fetch test data and results
      const [testResponse, resultsResponse] = await Promise.all([
        aiKnowledgeAPI.getTest(testId),
        aiKnowledgeAPI.getTestResults(testId)
      ]);

      setResultsState({
        isLoading: false,
        testData: testResponse.data,
        resultsData: resultsResponse.data,
        error: null
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load AI Knowledge test results';
      console.error('❌ Failed to load AI Knowledge results:', error);
      setResultsState({
        isLoading: false,
        testData: null,
        resultsData: null,
        error: errorMessage
      });
    }
  }, [isAuthenticated]);

  // Initialize on mount
  useEffect(() => {
    initializeResults();
  }, [initializeResults]);

  // Chart configuration for radar chart
  const getRadarChartOptions = (resultsData: AiKnowledgeTestResults) => {
    const categories = Object.keys(AI_KNOWLEDGE_CATEGORIES);
    const scores = categories.map(code => {
      switch (code) {
        case 'PE': return resultsData.pe_score;
        case 'EE': return resultsData.ee_score;
        case 'SI': return resultsData.si_score;
        case 'FC': return resultsData.fc_score;
        case 'HM': return resultsData.hm_score;
        case 'PV': return resultsData.pv_score;
        case 'HT': return resultsData.ht_score;
        case 'BI': return resultsData.bi_score;
        default: return 0;
      }
    });

    return {
      series: [{
        name: 'AI Knowledge Scores',
        data: scores
      }],
      options: {
        chart: {
          height: 350,
          type: 'radar' as const,
          fontFamily: 'Merriweather Sans, sans-serif'
        },
        xaxis: {
          categories: categories.map(code => AI_KNOWLEDGE_CATEGORIES[code as keyof typeof AI_KNOWLEDGE_CATEGORIES].name)
        },
        yaxis: {
          min: 0,
          max: resultsData.max_score,
          tickAmount: 5
        },
        colors: ['#2A3262'],
        fill: {
          opacity: 0.2
        },
        stroke: {
          width: 2
        },
        markers: {
          size: 6
        },
        legend: {
          show: false
        }
      }
    };
  };

  // Bar chart for individual scores
  const getBarChartOptions = (resultsData: AiKnowledgeTestResults) => {
    const categories = Object.keys(AI_KNOWLEDGE_CATEGORIES);
    const scores = categories.map(code => {
      switch (code) {
        case 'PE': return resultsData.pe_score;
        case 'EE': return resultsData.ee_score;
        case 'SI': return resultsData.si_score;
        case 'FC': return resultsData.fc_score;
        case 'HM': return resultsData.hm_score;
        case 'PV': return resultsData.pv_score;
        case 'HT': return resultsData.ht_score;
        case 'BI': return resultsData.bi_score;
        default: return 0;
      }
    });

    const colors = categories.map(code => AI_KNOWLEDGE_CATEGORIES[code as keyof typeof AI_KNOWLEDGE_CATEGORIES].color);

    return {
      series: [{
        name: 'Score',
        data: scores
      }],
      options: {
        chart: {
          type: 'bar' as const,
          height: 400,
          fontFamily: 'Merriweather Sans, sans-serif'
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function(val: number) {
            return val.toFixed(1);
          }
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: categories,
          labels: {
            style: {
              fontSize: '12px'
            }
          }
        },
        yaxis: {
          title: {
            text: 'Score'
          },
          min: 0,
          max: resultsData.max_score
        },
        fill: {
          opacity: 1
        },
        colors: colors,
        tooltip: {
          y: {
            formatter: function (val: number, opts: any) {
              const categoryCode = categories[opts.dataPointIndex];
              const categoryInfo = AI_KNOWLEDGE_CATEGORIES[categoryCode as keyof typeof AI_KNOWLEDGE_CATEGORIES];
              return `${val.toFixed(1)}/${resultsData.max_score} - ${categoryInfo.description}`;
            }
          }
        },
        legend: {
          show: false
        }
      }
    };
  };

  // Loading state
  if (resultsState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#2A3262' }}>Loading Your AI Knowledge Results...</h2>
          <p className="text-gray-600">Processing your AI learning attitudes assessment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (resultsState.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4 text-red-700">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">{resultsState.error}</p>
          <Link
            href="/ai-knowledge-test"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Take Test Again
          </Link>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4 text-yellow-700">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please login to view your AI Knowledge test results</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const { resultsData } = resultsState;

  if (!resultsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4 text-yellow-700">No Results Found</h2>
          <p className="text-gray-600 mb-4">No results data available for this test</p>
          <Link
            href="/ai-knowledge-test"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Take Test Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="ai-knowledge-test-results" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Check className="w-12 h-12 text-green-500 mr-3" />
            <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: '#2A3262' }}>
              AI Knowledge Assessment Results
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your comprehensive analysis of attitudes toward AI usage in learning
          </p>
        </div>

        {/* Overall Score Card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="text-center" style={{ backgroundColor: '#2A3262' }}>
            <CardTitle className="text-white text-2xl">Overall AI Readiness Score</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2" style={{ color: '#2A3262' }}>
                {resultsData.total_score.toFixed(1)}
              </div>
              <div className="text-xl text-gray-600 mb-4">
                out of {resultsData.max_score.toFixed(1)}
              </div>
              <div className="text-lg font-medium" style={{ color: '#ABD305' }}>
                {resultsData.result_description.ai_readiness_level}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center" style={{ color: '#2A3262' }}>
                <TrendingUp className="w-5 h-5 mr-2" />
                AI Attitudes Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {typeof window !== 'undefined' && (
                <ApexCharts
                  options={getRadarChartOptions(resultsData).options}
                  series={getRadarChartOptions(resultsData).series}
                  type="radar"
                  height={350}
                />
              )}
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center" style={{ color: '#2A3262' }}>
                <BarChart3 className="w-5 h-5 mr-2" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {typeof window !== 'undefined' && (
                <ApexCharts
                  options={getBarChartOptions(resultsData).options}
                  series={getBarChartOptions(resultsData).series}
                  type="bar"
                  height={400}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Category Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(AI_KNOWLEDGE_CATEGORIES).map(([code, info]) => {
            const score = (() => {
              switch (code) {
                case 'PE': return resultsData.pe_score;
                case 'EE': return resultsData.ee_score;
                case 'SI': return resultsData.si_score;
                case 'FC': return resultsData.fc_score;
                case 'HM': return resultsData.hm_score;
                case 'PV': return resultsData.pv_score;
                case 'HT': return resultsData.ht_score;
                case 'BI': return resultsData.bi_score;
                default: return 0;
              }
            })();

            const percentage = (score / resultsData.max_score) * 100;

            return (
              <Card key={code} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">{code}</CardTitle>
                  <div className="text-lg font-bold" style={{ color: info.color }}>
                    {info.name}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Score</span>
                      <span className="font-medium">{score.toFixed(1)}/{resultsData.max_score}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: info.color,
                          width: `${percentage}%`
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {info.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Results Description */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle style={{ color: '#2A3262' }}>Your AI Learning Profile</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#2A3262' }}>
              {resultsData.result_description.title}
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              {resultsData.result_description.description}
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Recommendations:</h4>
              <p className="text-blue-800">
                {resultsData.result_description.recommendations}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <Link
            href="/ai-knowledge-test"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Take Test Again
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2A3262' }}
          >
            Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AiKnowledgeTestResults;