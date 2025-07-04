"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Lock, AlertCircle, User } from 'lucide-react';
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

// Midtrans result types
interface MidtransResult {
  transaction_id: string;
  payment_type: string;
  status_message: string;
}

// Extended API Error for specific error handling
interface OrderError extends Error {
  response?: {
    data?: {
      code?: string;
      errors?: {
        test?: string[];
      };
      message?: string;
      status?: number;
    };
    status?: number;
  };
}

// Declare global Midtrans types
declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: MidtransResult) => void;
        onPending: (result: MidtransResult) => void;
        onError: (result: MidtransResult) => void;
        onClose: () => void;
      }) => void;
    };
  }
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
  const [snapUrl, setSnapUrl] = useState<string | null>(null);

  // Check payment status using API endpoint
  const checkPaymentStatus = useCallback(async (testId: string) => {
    try {
      // Get the order information for this test
      const orderResponse = await fetch(`https://api.cakravia.com/api/v1/users/vark_tests/${testId}/orders`, {
        headers: {
          'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]?.split(';')[0]}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        const order = orderData.data;
        
        // Check if payment is completed based on order status
        const hasValidPayment = order.status === 'paid' && order.can_download_certificate === true;
        
        if (hasValidPayment) {
          setIsPaid(true);
          setResultsState(prev => ({ ...prev, canDownloadCertificate: true }));
        } else {
          setIsPaid(false);
          setResultsState(prev => ({ ...prev, canDownloadCertificate: false }));
        }
        
        return hasValidPayment;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
      return false;
    }
  }, []);

  // Load Midtrans Snap script
  useEffect(() => {
    const loadMidtransScript = () => {
      if (document.getElementById('midtrans-script')) return;
      
      const script = document.createElement('script');
      script.id = 'midtrans-script';
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', 'SB-Mid-client-BnZAW_h-FqRtI-kz'); // Sandbox client key - replace with your production key
      document.body.appendChild(script);
    };
    
    loadMidtransScript();
  }, []);

  // Open Midtrans Snap popup
  const openSnapPopup = useCallback((snapToken: string) => {
    if (window.snap) {
      window.snap.pay(snapToken, {
        onSuccess: function(result: MidtransResult) {
          console.log('Payment successful:', result);
          
          // Verify payment status with API
          const urlParams = new URLSearchParams(window.location.search);
          const testId = urlParams.get('testId');
          if (testId) {
            setTimeout(() => {
              checkPaymentStatus(testId);
            }, 2000); // Wait 2 seconds for payment to be processed on server
          }
        },
        onPending: function(result: MidtransResult) {
          console.log('Payment pending:', result);
        },
        onError: function(result: MidtransResult) {
          console.error('Payment failed:', result);
        },
        onClose: function() {
          console.log('Payment popup closed');
        }
      });
    } else {
      console.log('Midtrans Snap not loaded, opening in new tab');
      if (snapUrl) {
        window.open(snapUrl, '_blank');
      }
    }
  }, [checkPaymentStatus, snapUrl]);

  // Enhanced certificate purchase handler with existing order check
  const handlePurchaseCertificate = async () => {
    try {
      setIsProcessingPayment(true);
      
      // Get the test ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const testId = urlParams.get('testId');
      
      if (!testId) {
        throw new Error('Test ID not found. Cannot process payment.');
      }
      
      try {
        // First, try to initialize payment (create new order)
        const paymentResult = await paymentAPI.initializeVarkPayment(testId);
        
        const snapToken = paymentResult.paymentToken.snap_token;
        const midtransResponse = JSON.parse(paymentResult.paymentToken.midtrans_response);
        const snapUrl = midtransResponse.redirect_url;
        setSnapUrl(snapUrl);
        
        openSnapPopup(snapToken);
        
      } catch (orderError: unknown) {
        // Type guard to check if it's an error with the expected structure
        const isOrderError = (error: unknown): error is OrderError => {
          return typeof error === 'object' && 
                 error !== null && 
                 'response' in error;
        };

        // Check if error is about existing order
        if (isOrderError(orderError) && 
            orderError?.response?.data?.code === 'CKV-422' && 
            orderError?.response?.data?.errors?.test?.includes('already has an order')) {
          
          try {
            // Get auth token for direct API call
            const authToken = document.cookie.split('auth_token=')[1]?.split(';')[0];
            if (!authToken) {
              throw new Error('Authentication token not found');
            }
            
            // Call payment token endpoint directly for existing order
            const tokenResponse = await fetch(
              `https://api.cakravia.com/api/v1/users/vark_tests/${testId}/orders/payment_token`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (!tokenResponse.ok) {
              const errorData = await tokenResponse.json().catch(() => ({}));
              throw new Error(errorData.message || `Failed to get payment token: ${tokenResponse.status}`);
            }
            
            const tokenData = await tokenResponse.json();
            
            // Extract snap URL from token response
            const midtransResponse = JSON.parse(tokenData.data.midtrans_response);
            const snapUrl = midtransResponse.redirect_url;
            setSnapUrl(snapUrl);
            
            // Open payment popup with existing order token
            openSnapPopup(tokenData.data.snap_token);
            
          } catch (tokenError) {
            const tokenErrorMessage = tokenError instanceof Error ? tokenError.message : 'Failed to get payment token';
            throw new Error(`Could not retrieve payment token: ${tokenErrorMessage}`);
          }
          
        } else {
          // Re-throw if it's a different error
          throw orderError;
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
      console.error('Payment error:', error);
      alert(`Payment failed: ${errorMessage}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Certificate download handler
  const handleDownloadCertificate = async () => {
    try {
      // Get the test ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const testId = urlParams.get('testId');
      
      if (!testId) {
        throw new Error('Test ID not found. Cannot download certificate.');
      }
      
      // Get auth token from cookie
      const authToken = document.cookie.split('auth_token=')[1]?.split(';')[0];
      if (!authToken) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // Make API call to download certificate
      const response = await fetch(`https://api.cakravia.com/api/v1/users/vark_tests/${testId}/orders/download_certificate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Download failed with status: ${response.status}`);
      }
      
      // Check if response is a PDF file
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        // Handle PDF download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VARK_Certificate_${testId.slice(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Handle other response types (e.g., JSON with download URL)
        const data = await response.json();
        if (data.download_url) {
          window.open(data.download_url, '_blank');
        } else {
          throw new Error('Invalid response format for certificate download');
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download certificate';
      console.error('Certificate download error:', error);
      alert(`Download failed: ${errorMessage}`);
    }
  };

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
  
  // Create organized data with both scores and percentages - Updated colors
  const organizedScores = [
    { 
      name: 'Visual', 
      score: scoresData.visual, 
      percentage: percentageData.find(item => item.code === 'V')?.percentage || 0,
      color: '#8979FF' 
    },
    { 
      name: 'Auditory', 
      score: scoresData.auditory, 
      percentage: percentageData.find(item => item.code === 'A')?.percentage || 0,
      color: '#FF928A' 
    },
    { 
      name: 'Reading', 
      score: scoresData.reading, 
      percentage: percentageData.find(item => item.code === 'R')?.percentage || 0,
      color: '#3CC3DF' 
    },
    { 
      name: 'Kinesthetic', 
      score: scoresData.kinesthetic, 
      percentage: percentageData.find(item => item.code === 'K')?.percentage || 0,
      color: '#FFAE4C' 
    }
  ];

  // Sort by score to get highest first
  const sortedScores = [...organizedScores].sort((a, b) => b.score - a.score);
  const highestScore = sortedScores[0];
  const otherScores = sortedScores.slice(1);

  // Load results data
  useEffect(() => {
    const loadResults = async () => {
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
        
        // Check payment status for this test
        await checkPaymentStatus(testId);
        
        setResultsState(prev => ({
          ...prev,
          isLoading: false,
          resultsData,
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
  }, [isAuthenticated, user, checkPaymentStatus]);

  // Data for ApexCharts Radial Bar Chart (Learning Preferences) - Using percentages
  const learningChartSeries = [
    organizedScores.find(item => item.name === 'Visual')?.percentage || 0,
    organizedScores.find(item => item.name === 'Auditory')?.percentage || 0,
    organizedScores.find(item => item.name === 'Reading')?.percentage || 0,
    organizedScores.find(item => item.name === 'Kinesthetic')?.percentage || 0
  ];

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
        track: {
          background: '#E5E7EB', // Grey color for unfilled portions
          strokeWidth: '100%',
          margin: 5,
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
          formatter: (seriesName: string, opts: { w: { globals: { series: number[] } }; seriesIndex: number }) => 
            seriesName + ":  " + opts.w.globals.series[opts.seriesIndex] + "%",
        },
      },
    },
    colors: ["#8979FF", "#FF928A", "#3CC3DF", "#FFAE4C"], // Updated color scheme
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

  // Individual scores component - Updated to use ApexCharts for single values
  const SmallChart: React.FC<SmallChartProps> = ({ score, name, color }) => {
    const percentage = organizedScores.find(item => item.name === name)?.percentage || 0;
    
    const singleChartOptions = {
      chart: {
        height: 200,
        type: "radialBar" as const,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          hollow: {
            margin: 5,
            size: "50%",
            background: "transparent",
          },
          track: {
            background: '#E5E7EB', // Grey color for unfilled portions
            strokeWidth: '100%',
            margin: 5,
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: "bold",
              color: "#2A3262",
              formatter: () => `${percentage.toFixed(1)}%`,
            },
          },
        },
      },
      colors: [color],
      labels: [name],
      stroke: {
        lineCap: "round" as const,
      },
    };
    
    return (
      <div className="rounded-xl overflow-hidden shadow-lg">
        <div 
          className="text-white text-center py-3 font-bold text-lg"
          style={{ backgroundColor: '#8BC34A' }}
        >
          {name} Score: {score}
        </div>
        <div className="p-6 bg-gray-50">
          <ApexCharts
            options={singleChartOptions}
            series={[percentage]}
            type="radialBar"
            height={200}
          />
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

  // Don't render if no results data
  if (!resultsState.resultsData) {
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
          
          <Link 
            href="/test" 
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Take Test
          </Link>
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
          {user && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Welcome back, {user.name}!</h2>
                  <p className="text-gray-600">Here are your VARK Learning Style Assessment results</p>
                </div>
              </div>
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
                    <CardTitle className="text-center text-2xl font-bold" style={{ color: '#24348C' }}>Total Learning Percentage</CardTitle>
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
                  {isPaid ? (
                    <button 
                      className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#4A47A3' }}
                      onClick={handleDownloadCertificate}
                    >
                      Download PDF Certificate
                    </button>
                  ) : (
                    <button 
                      className="w-full py-3 rounded-lg text-white font-medium cursor-not-allowed"
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
                <Card className="rounded-lg overflow-hidden border-none shadow-lg">
                  <CardHeader className="bg-[#8BC34A] text-white rounded-t-lg py-4">
                    <CardTitle className="text-center text-2xl font-bold" style={{ color: '#24348C' }}>
                      {highestScore.name} Learning Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 bg-[#F0F2F5]">
                    {/* Primary Learning Style Chart - Only show the highest score */}
                    <ApexCharts
                      options={{
                        ...learningChartOptions,
                        colors: ["#8979FF", "#FF928A", "#3CC3DF", "#FFAE4C"], // Keep all colors
                        plotOptions: {
                          ...learningChartOptions.plotOptions,
                          radialBar: {
                            ...learningChartOptions.plotOptions.radialBar,
                            barLabels: {
                              enabled: true,
                              useSeriesColors: true,
                              offsetX: -8,
                              fontSize: "16px",
                              formatter: (seriesName: string, opts: { w: { globals: { series: number[] } }; seriesIndex: number }) => {
                                const value = opts.w.globals.series[opts.seriesIndex];
                                return value > 0 ? `${seriesName}: ${value}%` : `${seriesName}: 0%`;
                              },
                            },
                          },
                        },
                      }}
                      series={[
                        highestScore.name === 'Visual' ? highestScore.percentage : 0,
                        highestScore.name === 'Auditory' ? highestScore.percentage : 0,
                        highestScore.name === 'Reading' ? highestScore.percentage : 0,
                        highestScore.name === 'Kinesthetic' ? highestScore.percentage : 0,
                      ]}
                      type="radialBar"
                      height={390}
                    />
                  </CardContent>
                </Card>
              </div>
              
              <div className="w-1/2">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#4A47A3' }}>
                  {highestScore.name} Learning Style ({highestScore.percentage.toFixed(1)}%)
                </h3>
                
                <p className="mb-4 text-gray-700">
                  You prefer {highestScore.name.toLowerCase()} representations of information such as pictures, diagrams, flow charts, time lines, films, and demonstrations.
                </p>
                
                <p className="text-gray-700">
                  This is your strongest learning preference based on your assessment results. Consider incorporating more {highestScore.name.toLowerCase()} learning techniques into your study routine.
                </p>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Your Primary Score:</h4>
                  <div className="text-2xl font-bold text-blue-600">
                    {highestScore.score} points ({highestScore.percentage.toFixed(1)}%)
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    This represents your strongest learning preference
                  </p>
                </div>
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
        </div>
      </main>

      {/* Footer */}
      <Footer className="relative z-10" />
    </div>
  );
};

export default EnhancedResultsDashboard;