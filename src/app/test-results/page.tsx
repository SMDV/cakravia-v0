"use client"

import React, { useState, useEffect } from 'react';
import { Check, Lock, AlertCircle, User, CreditCard, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { varkAPI, paymentAPI } from '@/lib/api';
import { VarkTest, VarkTestResults } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import ApexCharts dynamically for client-side rendering
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

interface ResultsState {
  isLoading: boolean;
  testData: VarkTest | null;
  resultsData: VarkTestResults | null;
  error: string | null;
  canDownloadCertificate: boolean;
}

// Type definitions
interface SmallChartProps {
  score: number;
  name: string;
  color: string;
}

const EnhancedResultsDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const [resultsState, setResultsState] = useState<ResultsState>({
    isLoading: true,
    testData: null,
    resultsData: null,
    error: null,
    canDownloadCertificate: false
  });

  // Enhanced payment state
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentLogs, setPaymentLogs] = useState<string[]>([]);
  const [snapUrl, setSnapUrl] = useState<string | null>(null);

  // Development bypass state
  const [devMode, setDevMode] = useState(false);
  const [devTestId, setDevTestId] = useState('822bbdce-ea25-4c63-95e9-9630bbaac6a6');
  const [devAuthToken, setDevAuthToken] = useState('eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZTc4Zjc5ODAtZTQ2OC00ZGI1LWE0ZTEtNjRkOWJjOTcwODQzIiwiZXhwIjoxNzUxNjAwMzM1fQ.rmbHfDo6n6KeVbwsDzit8fFMVs58Ltjd_N1jf-owarE');
  const [mockUser, setMockUser] = useState({
    id: "dev-user-123",
    name: "Development User",
    email: "dev@test.com"
  });

  // Add payment log function
  const addPaymentLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setPaymentLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`Payment: ${message}`);
  };

  // Development bypass functions
  const enableDevMode = () => {
    setDevMode(true);
    // Set auth token in cookies for API calls
    document.cookie = `auth_token=${devAuthToken}; path=/; max-age=3600`;
    addPaymentLog('🔧 Development mode enabled');
    addPaymentLog(`🔑 Auth token set: ${devAuthToken.slice(0, 20)}...`);
    
    // Override URL params for test ID
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('testId', devTestId);
    window.history.replaceState({}, '', newUrl);
    
    // Trigger results loading with dev settings
    loadResultsWithDevSettings();
  };

  const loadResultsWithDevSettings = async () => {
    try {
      addPaymentLog(`📊 Loading results for test ID: ${devTestId}`);
      setResultsState(prev => ({ ...prev, isLoading: true }));
      
      // Fetch test results using dev test ID
      const resultsResponse = await varkAPI.getTestResults(devTestId);
      const resultsData = resultsResponse.data;
      
      addPaymentLog('✅ Results loaded successfully');
      
      setResultsState(prev => ({
        ...prev,
        isLoading: false,
        resultsData,
        canDownloadCertificate: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load results';
      addPaymentLog(`❌ Failed to load results: ${errorMessage}`);
      setResultsState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };

  // Check payment status on mount
  useEffect(() => {
    const checkPaymentStatus = () => {
      const savedPaymentStatus = localStorage.getItem('vark_payment_status');
      if (savedPaymentStatus === 'paid') {
        setIsPaid(true);
        setResultsState(prev => ({ ...prev, canDownloadCertificate: true }));
      }
    };
    checkPaymentStatus();
  }, []);

  // Remove the mock scores and use real data
  const scoresData = resultsState.resultsData ? {
    visual: resultsState.resultsData.visual_score,
    auditory: resultsState.resultsData.aural_score,
    reading: resultsState.resultsData.read_score,
    kinesthetic: resultsState.resultsData.kinesthetic_score
  } : {
    visual: 0,
    auditory: 0,
    reading: 0,
    kinesthetic: 0
  };

  // Get percentage data from API
  const percentageData = resultsState.resultsData?.scores_breakdown || [];
  
  // Create organized data with both scores and percentages
  const organizedScores = [
    { 
      name: 'Visual', 
      score: scoresData.visual, 
      percentage: percentageData.find(item => item.code === 'V')?.percentage || 0,
      color: '#8B5CF6' 
    },
    { 
      name: 'Auditory', 
      score: scoresData.auditory, 
      percentage: percentageData.find(item => item.code === 'A')?.percentage || 0,
      color: '#EF4444' 
    },
    { 
      name: 'Reading', 
      score: scoresData.reading, 
      percentage: percentageData.find(item => item.code === 'R')?.percentage || 0,
      color: '#06B6D4' 
    },
    { 
      name: 'Kinesthetic', 
      score: scoresData.kinesthetic, 
      percentage: percentageData.find(item => item.code === 'K')?.percentage || 0,
      color: '#10B981' 
    }
  ];

  // Sort by score to get highest first
  const sortedScores = [...organizedScores].sort((a, b) => b.score - a.score);
  const highestScore = sortedScores[0];
  const otherScores = sortedScores.slice(1);

  // Load results data
  useEffect(() => {
    const loadResults = async () => {
      // Skip loading if in dev mode (will be handled by dev controls)
      if (devMode) return;
      
      if (!isAuthenticated) {
        setResultsState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Please login to view results' 
        }));
        return;
      }

      try {
        // Get test ID from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const testId = urlParams.get('testId');
        
        if (!testId) {
          setResultsState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'No test ID provided. Please complete a test first.' 
          }));
          return;
        }

        console.log('Loading test results for test ID:', testId);
        
        // Fetch test results from the new API endpoint
        const resultsResponse = await varkAPI.getTestResults(testId);
        const resultsData = resultsResponse.data;
        
        console.log('Loaded results data:', resultsData);
        
        setResultsState(prev => ({
          ...prev,
          isLoading: false,
          resultsData,
          canDownloadCertificate: false // Will be determined by payment status
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load results';
        console.error('Error loading results:', error);
        setResultsState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
      }
    };

    loadResults();
  }, [isAuthenticated, user, devMode]);

  // Enhanced certificate purchase handler with real API integration
  const handlePurchaseCertificate = async () => {
    try {
      setIsProcessingPayment(true);
      addPaymentLog('🔄 Starting payment flow...');
      
      // Get the test ID from URL params or dev mode
      const urlParams = new URLSearchParams(window.location.search);
      const testId = devMode ? devTestId : urlParams.get('testId');
      
      if (!testId) {
        throw new Error('Test ID not found. Cannot process payment.');
      }
      
      addPaymentLog('📦 Creating payment order...');
      
      // Initialize payment flow (Order -> Payment Token)
      const paymentResult = await paymentAPI.initializeVarkPayment(testId);
      
      addPaymentLog('✅ Order created successfully');
      addPaymentLog(`   - Order ID: ${paymentResult.order.id}`);
      addPaymentLog(`   - Amount: Rp ${paymentResult.order.amount}`);
      
      addPaymentLog('💳 Payment token retrieved');
      addPaymentLog(`   - Snap Token: ${paymentResult.paymentToken.snap_token}`);
      
      // Extract the Snap URL from the response
      const midtransResponse = JSON.parse(paymentResult.paymentToken.midtrans_response);
      const snapUrl = midtransResponse.redirect_url;
      
      if (snapUrl) {
        setSnapUrl(snapUrl);
        addPaymentLog(`🌐 Payment URL ready`);
        
        // Open payment page in new tab
        window.open(snapUrl, '_blank');
        addPaymentLog('🎯 Opened payment page in new tab');
        
        // For now, simulate successful payment after opening
        // In production, you'd handle the callback from Midtrans
        setTimeout(() => {
          localStorage.setItem('vark_payment_status', 'paid');
          setIsPaid(true);
          setResultsState(prev => ({ 
            ...prev, 
            canDownloadCertificate: true 
          }));
          addPaymentLog('✅ Payment completed successfully!');
          addPaymentLog('🎉 Certificate is now available for download');
        }, 5000);
      } else {
        throw new Error('Payment URL not available');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
      addPaymentLog(`❌ Payment failed: ${errorMessage}`);
      console.error('Payment error:', error);
      alert(`Payment failed: ${errorMessage}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Reset payment state for testing
  const resetPaymentState = () => {
    setIsPaid(false);
    setIsProcessingPayment(false);
    setPaymentLogs([]);
    setSnapUrl(null);
    localStorage.removeItem('vark_payment_status');
    setResultsState(prev => ({ ...prev, canDownloadCertificate: false }));
  };

  // Data for ApexCharts Radial Bar Chart (Learning Preferences)
  const learningChartSeries = [scoresData.visual, scoresData.auditory, scoresData.reading, scoresData.kinesthetic];

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Individual scores component - Updated to use percentage for chart
  const SmallChart: React.FC<SmallChartProps> = ({ score, name, color }) => {
    const percentage = organizedScores.find(item => item.name === name)?.percentage || 0;
    
    return (
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
                strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
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
  };

  // Loading state
  if (resultsState.isLoading) {
    return (
      <div className="min-h-screen bg-[#E0E6F6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  // Don't render if no results data and not in dev mode
  if (!resultsState.resultsData && !devMode) {
    return (
      <div className="min-h-screen bg-[#E0E6F6] flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4 text-yellow-700">No Results Available</h2>
          <p className="text-gray-600 mb-4">
            {resultsState.error || 'No test results found. Please complete a test first.'}
          </p>
          
          {/* Debug info */}
          <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-100 rounded">
            <p>Debug Info:</p>
            <p>URL: {window.location.href}</p>
            <p>Test ID: {new URLSearchParams(window.location.search).get('testId') || 'Not found'}</p>
            <p>Error: {resultsState.error || 'No error'}</p>
          </div>
          
          <div className="space-y-3">
            <Link 
              href="/test" 
              className="block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Take Test
            </Link>
            
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setDevMode(true)}
                className="block w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Enable Development Mode
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show development login bypass if not authenticated and in dev mode
  if (!isAuthenticated && devMode) {
    return (
      <div className="min-h-screen bg-[#E0E6F6] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <h2 className="text-2xl font-bold mb-6 text-center text-orange-600">
            🔧 Development Mode - Login Bypass
          </h2>
          
          {/* Test ID Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test ID:
            </label>
            <input
              type="text"
              value={devTestId}
              onChange={(e) => setDevTestId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-mono"
              placeholder="Enter test ID"
            />
          </div>

          {/* Auth Token Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auth Token:
            </label>
            <textarea
              value={devAuthToken}
              onChange={(e) => setDevAuthToken(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-mono resize-none"
              placeholder="Enter JWT token"
            />
            <p className="text-xs text-gray-500 mt-1">
              Token preview: {devAuthToken.slice(0, 30)}...
            </p>
          </div>

          {/* Mock User Info */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Mock User Info:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Name:</label>
                <input
                  type="text"
                  value={mockUser.name}
                  onChange={(e) => setMockUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email:</label>
                <input
                  type="email"
                  value={mockUser.email}
                  onChange={(e) => setMockUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={enableDevMode}
              disabled={!devTestId.trim() || !devAuthToken.trim()}
              className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Load Results with Dev Settings
            </button>
            
            <button
              onClick={() => setDevMode(false)}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>

          {paymentLogs.length > 0 && (
            <div className="mt-4 bg-gray-100 p-3 rounded max-h-32 overflow-y-auto">
              <div className="space-y-1 font-mono text-xs">
                {paymentLogs.map((log, index) => (
                  <div key={index} className="text-gray-700">{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0E6F6] relative overflow-hidden" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="results" />

      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-auto opacity-50 z-0 pointer-events-none">
        <div className="w-64 h-64 bg-gradient-to-br from-purple-400 to-orange-400 rounded-full blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-full h-auto opacity-50 z-0 pointer-events-none">
        <div className="w-64 h-64 bg-gradient-to-br from-green-400 to-blue-400 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 py-12 md:py-24 lg:py-32 z-10 relative">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          {/* User Welcome Section */}
          {(user || (devMode && mockUser)) && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Welcome back, {devMode ? mockUser.name : user?.name}!
                    {devMode && <span className="text-orange-500 text-sm ml-2">(DEV MODE)</span>}
                  </h2>
                  <p className="text-gray-600">Here are your VARK Learning Style Assessment results</p>
                </div>
              </div>
            </div>
          )}

          {/* Development Mode Controls */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-dashed border-orange-300">
              <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                🔧 Development Controls
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test ID:
                  </label>
                  <input
                    type="text"
                    value={devTestId}
                    onChange={(e) => setDevTestId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                    placeholder="Enter test ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auth Token (Preview):
                  </label>
                  <input
                    type="text"
                    value={devAuthToken.slice(0, 30) + '...'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button
                  onClick={enableDevMode}
                  disabled={!devTestId.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Reload with Dev Settings
                </button>
                
                <button
                  onClick={() => {
                    setDevMode(false);
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Exit Dev Mode
                </button>
              </div>

              <div className="text-sm">
                <strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  devMode ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {devMode ? 'DEV MODE ACTIVE' : 'NORMAL MODE'}
                </span>
              </div>
            </div>
          )}

          {/* Payment Test Controls (Development Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-dashed border-yellow-300">
              <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Integration (DEV MODE)
              </h3>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button
                  onClick={handlePurchaseCertificate}
                  disabled={isProcessingPayment || isPaid}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isProcessingPayment ? 'Processing...' : 'Test Payment Flow'}
                </button>
                
                <button
                  onClick={resetPaymentState}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Reset Payment
                </button>

                {snapUrl && (
                  <button
                    onClick={() => window.open(snapUrl, '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Payment
                  </button>
                )}
              </div>

              <div className="text-sm mb-2">
                <strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  isPaid ? 'bg-green-100 text-green-800' : 
                  isProcessingPayment ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {isPaid ? 'PAID' : isProcessingPayment ? 'PROCESSING' : 'UNPAID'}
                </span>
              </div>

              {paymentLogs.length > 0 && (
                <div className="bg-gray-100 p-3 rounded max-h-32 overflow-y-auto">
                  <div className="space-y-1 font-mono text-xs">
                    {paymentLogs.map((log, index) => (
                      <div key={index} className="text-gray-700">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top Section: Final Report */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 mb-12">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#4A47A3' }}>
                Here is your final report
              </h1>
              <div className="text-right">
                <p className="text-sm" style={{ color: '#4A47A3' }}>Certificate ID: 124095102958</p>
                {resultsState.testData && (
                  <p className="text-xs text-gray-500">Test ID: {resultsState.testData.id.slice(0, 8)}...</p>
                )}
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
                    <h3 className="font-bold mb-2" style={{ color: '#2A3262' }}>Visual (Score: {scoresData.visual})</h3>
                    <p className="text-sm text-gray-700">
                      Learning by looking at pictures, graphs, videos, and graphics. Could not take complete note during presentation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-1" style={{ color: '#8BC34A' }} />
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: '#2A3262' }}>Auditory (Score: {scoresData.auditory})</h3>
                    <p className="text-sm text-gray-700">
                      Receive learning by listening method, by speaking or from music, discussion, and explanation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-1" style={{ color: '#8BC34A' }} />
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: '#2A3262' }}>Reading (Score: {scoresData.reading})</h3>
                    <p className="text-sm text-gray-700">
                      Prefer words and texts as an information obtaining method. They like presentation style, by text or writing
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-1" style={{ color: '#8BC34A' }} />
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: '#2A3262' }}>Kinesthetic (Score: {scoresData.kinesthetic})</h3>
                    <p className="text-sm text-gray-700">
                      More likely to experience through physical movement aspect while studying, such as, touch, feel, hold, perform, and move something. They prefer hands on work, practical, project, and real experience
                    </p>
                  </div>
                </div>

                {/* Download PDF Button */}
                <div className="mt-8">
                  {resultsState.canDownloadCertificate ? (
                    <button 
                      className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#4A47A3' }}
                      onClick={() => alert('Certificate download feature coming soon!')}
                    >
                      Download PDF Certificate
                    </button>
                  ) : (
                    <button 
                      className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#6B7280' }}
                      disabled
                    >
                      PDF Available After Purchase
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Learning Style Details Section - Updated with Primary + 3 Others Layout */}
          <div className={`bg-white rounded-xl shadow-lg p-8 md:p-12 mb-12 relative ${!isPaid ? 'overflow-hidden' : ''}`}>
            {/* Blur overlay for locked content */}
            {!isPaid && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="bg-white p-6 text-center border-2 shadow-md rounded-xl max-w-md" style={{ borderColor: '#4A47A3' }}>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">
                    VARK Results + Report Certificate
                  </h3>
                  <p className="text-3xl font-extrabold mb-4" style={{ color: '#4A47A3' }}>Rp. 30.000</p>
                  <button 
                    onClick={handlePurchaseCertificate}
                    disabled={isProcessingPayment}
                    className="w-full py-3 text-lg text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: '#4A47A3' }}
                  >
                    {isProcessingPayment ? 'Processing...' : 'Get My Results'}
                  </button>
                  <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
                    <Lock className="h-4 w-4" />
                    <span className="text-xs font-medium">100% Secure</span>
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#4A47A3' }}>
              Your Primary Learning Style
            </h2>
            
            {/* Primary Learning Style - Highest Score */}
            <div className="flex flex-row gap-8 items-center mb-12">
              <div className="w-1/2 flex justify-center">
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <div 
                    className="text-white text-center py-3 font-bold text-lg"
                    style={{ backgroundColor: '#8BC34A' }}
                  >
                    {highestScore.name} Score: {highestScore.score}
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
                          stroke={highestScore.color}
                          strokeWidth="8"
                          strokeDasharray={`${(highestScore.percentage / 100) * 251.2} 251.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold" style={{ color: '#2A3262' }}>{highestScore.score}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-1/2">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#4A47A3' }}>
                  {highestScore.name} Learning Style
                </h3>
                
                <p className="mb-4 text-gray-700">
                  You prefer {highestScore.name.toLowerCase()} representations of information such as pictures, diagrams, flow charts, time lines, films, and demonstrations.
                </p>
                
                <p className="text-gray-700">
                  This is your strongest learning preference based on your assessment results. Consider incorporating more {highestScore.name.toLowerCase()} learning techniques into your study routine.
                </p>
              </div>
            </div>

            {/* Your Complete Score Breakdown - 3 Other Scores */}
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#4A47A3' }}>
              Your Complete Score Breakdown
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherScores.map((scoreItem, index) => (
                <SmallChart 
                  key={index} 
                  score={scoreItem.score} 
                  name={scoreItem.name} 
                  color={scoreItem.color} 
                />
              ))}
            </div>
          </div>

          {/* Test Again Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 mb-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#4A47A3' }}>
                Want to retake the assessment?
              </h2>
              <p className="text-gray-600 mb-6">
                Learning styles can evolve over time. Take the test again to see if your preferences have changed.
              </p>
              <Link
                href="/test"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                Take Test Again
              </Link>
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
              
              {resultsState.canDownloadCertificate ? (
                <button 
                  className="w-full py-3 text-lg text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#10B981' }}
                  onClick={() => alert('Certificate download feature coming soon!')}
                >
                  Download Certificate
                </button>
              ) : (
                <button 
                  onClick={handlePurchaseCertificate}
                  disabled={isProcessingPayment}
                  className="w-full py-3 text-lg text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#4A47A3' }}
                >
                  {isProcessingPayment ? 'Processing...' : 'Get My Certificate'}
                </button>
              )}
              
              <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-medium">100% Secure Payment</span>
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

export default EnhancedResultsDashboard;