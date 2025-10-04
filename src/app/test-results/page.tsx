"use client"

import React, { useState, useEffect, useCallback } from 'react';
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
  const { isAuthenticated, user, config } = useAuth();
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

  // Add payment log function with useCallback to prevent re-renders
  const addPaymentLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setPaymentLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`Payment: ${message}`);
  }, []);

  // Check payment status using API endpoint
  const checkPaymentStatus = useCallback(async (testId: string) => {
    try {
      addPaymentLog('🔍 Checking payment status...');
      
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
          addPaymentLog('✅ Payment verified - content unlocked');
          addPaymentLog(`💳 Payment method: ${order.payment?.payment_method || 'midtrans'}`);
          addPaymentLog(`📅 Paid at: ${order.payment?.paid_at || 'Unknown'}`);
          setIsPaid(true);
          setResultsState(prev => ({ ...prev, canDownloadCertificate: true }));
        } else {
          addPaymentLog(`ℹ️ Payment status: ${order.status} - content locked`);
          setIsPaid(false);
          setResultsState(prev => ({ ...prev, canDownloadCertificate: false }));
        }
        
        return hasValidPayment;
      } else {
        addPaymentLog('ℹ️ No order found for this test');
        return false;
      }
    } catch (error) {
      addPaymentLog('⚠️ Could not verify payment status');
      console.error('Payment status check failed:', error);
      return false;
    }
  }, [addPaymentLog]);

  // Load Midtrans Snap script
  useEffect(() => {
    const loadMidtransScript = () => {
      if (document.getElementById('midtrans-script')) return;
      
      const script = document.createElement('script');
      script.id = 'midtrans-script';
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', 'SB-Mid-client-BnZAW_h-FqRtI-kz'); // Sandbox client key - replace with your production key
      document.body.appendChild(script);
      
      script.onload = () => {
        addPaymentLog('📦 Midtrans Snap script loaded');
      };
      
      script.onerror = () => {
        addPaymentLog('❌ Failed to load Midtrans Snap script');
      };
    };
    
    loadMidtransScript();
  }, [addPaymentLog]);

  // Open Midtrans Snap popup
  const openSnapPopup = useCallback((snapToken: string) => {

    if (window.snap) {
      addPaymentLog('🎯 Opening Midtrans Snap popup');

      window.snap.pay(snapToken, {
        onSuccess: function(result: MidtransResult) {
          addPaymentLog('✅ Payment successful!');
          addPaymentLog(`📝 Transaction ID: ${result.transaction_id}`);
          addPaymentLog(`💰 Payment Type: ${result.payment_type}`);
          
          // Verify payment status with API
          const urlParams = new URLSearchParams(window.location.search);
          const testId = devMode ? devTestId : urlParams.get('testId');
          if (testId) {
            setTimeout(() => {
              checkPaymentStatus(testId);
            }, 2000); // Wait 2 seconds for payment to be processed on server
          }
        },
        onPending: function(result: MidtransResult) {
          addPaymentLog('⏳ Payment pending...');
          addPaymentLog(`📝 Transaction ID: ${result.transaction_id}`);
          addPaymentLog('💡 Please complete your payment');
        },
        onError: function(result: MidtransResult) {
          addPaymentLog('❌ Payment failed');
          addPaymentLog(`📝 Error: ${result.status_message}`);
        },
        onClose: function() {
          addPaymentLog('🚪 Payment popup closed');
          addPaymentLog('💡 Payment was not completed');
        }
      });
    } else {
      addPaymentLog('❌ Midtrans Snap not loaded, opening in new tab');
      if (snapUrl) {
        window.open(snapUrl, '_blank');
      }
    }
  }, [addPaymentLog, checkPaymentStatus, devMode, devTestId, snapUrl]);

  const loadResultsWithDevSettings = useCallback(async () => {
    try {
      addPaymentLog(`📊 Loading results for test ID: ${devTestId}`);
      setResultsState(prev => ({ ...prev, isLoading: true }));
      
      // Fetch test results using dev test ID
      const resultsResponse = await varkAPI.getTestResults(devTestId);
      const resultsData = resultsResponse.data;
      
      addPaymentLog('✅ Results loaded successfully');
      
      // Check payment status for this test
      await checkPaymentStatus(devTestId);
      
      setResultsState(prev => ({
        ...prev,
        isLoading: false,
        resultsData,
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
  }, [devTestId, addPaymentLog, checkPaymentStatus]);

  // Development bypass functions
  const enableDevMode = useCallback(() => {
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
  }, [devAuthToken, devTestId, addPaymentLog, loadResultsWithDevSettings]);

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
  }, [isAuthenticated, user, devMode, checkPaymentStatus]);

  // Enhanced certificate purchase handler with existing order check
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
      
      addPaymentLog('🔍 Checking for existing orders...');
      
      try {
        // First, try to initialize payment (create new order)
        addPaymentLog('📦 Attempting to create new payment order...');
        const paymentResult = await paymentAPI.initializeVarkPayment(testId);
        
        addPaymentLog('✅ New order created successfully');
        addPaymentLog(`   - Order ID: ${paymentResult.order.id}`);
        addPaymentLog(`   - Amount: Rp ${paymentResult.order.amount}`);
        
        const snapToken = paymentResult.paymentToken.snap_token;
        const midtransResponse = JSON.parse(paymentResult.paymentToken.midtrans_response);
        const snapUrl = midtransResponse.redirect_url;
        setSnapUrl(snapUrl);
        
        addPaymentLog('💳 Payment token retrieved for new order');
        addPaymentLog(`🌐 Payment ready - opening popup`);
        
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
          
          addPaymentLog('ℹ️ Found existing order, retrieving payment token...');
          
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
            
            addPaymentLog('✅ Payment token retrieved for existing order');
            addPaymentLog(`   - Snap Token: ${tokenData.data.snap_token}`);
            addPaymentLog(`   - Amount: Rp ${tokenData.data.amount}`);
            
            // Extract snap URL from token response
            const midtransResponse = JSON.parse(tokenData.data.midtrans_response);
            const snapUrl = midtransResponse.redirect_url;
            setSnapUrl(snapUrl);
            
            addPaymentLog('🔄 Continuing with existing order payment...');
            
            // Open payment popup with existing order token
            openSnapPopup(tokenData.data.snap_token);
            
          } catch (tokenError) {
            const tokenErrorMessage = tokenError instanceof Error ? tokenError.message : 'Failed to get payment token';
            addPaymentLog(`❌ Token retrieval failed: ${tokenErrorMessage}`);
            throw new Error(`Could not retrieve payment token: ${tokenErrorMessage}`);
          }
          
        } else {
          // Re-throw if it's a different error
          throw orderError;
        }
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

  // Certificate download handler
  const handleDownloadCertificate = async () => {
    try {
      addPaymentLog('📄 Starting certificate download...');
      
      // Get the test ID from URL params or dev mode
      const urlParams = new URLSearchParams(window.location.search);
      const testId = devMode ? devTestId : urlParams.get('testId');
      
      if (!testId) {
        throw new Error('Test ID not found. Cannot download certificate.');
      }
      
      // Get auth token from cookie
      const authToken = document.cookie.split('auth_token=')[1]?.split(';')[0];
      if (!authToken) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      addPaymentLog('🔐 Authenticating download request...');
      
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
      
      addPaymentLog('✅ Certificate download initiated');
      
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
        
        addPaymentLog('📁 Certificate downloaded successfully');
      } else {
        // Handle other response types (e.g., JSON with download URL)
        const data = await response.json();
        if (data.download_url) {
          window.open(data.download_url, '_blank');
          addPaymentLog('🌐 Certificate opened in new tab');
        } else {
          throw new Error('Invalid response format for certificate download');
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download certificate';
      addPaymentLog(`❌ Download failed: ${errorMessage}`);
      console.error('Certificate download error:', error);
      alert(`Download failed: ${errorMessage}`);
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
            
            <button
              onClick={() => setDevMode(true)}
              className="block w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Enable Development Mode
            </button>
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

                <button
                  onClick={handleDownloadCertificate}
                  disabled={!isPaid}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Test Download Certificate
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
                  <p className="text-3xl font-extrabold mb-4" style={{ color: '#4A47A3' }}>
                    Rp. {(config?.pricing.vark_price || 30000).toLocaleString('id-ID')}
                  </p>
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