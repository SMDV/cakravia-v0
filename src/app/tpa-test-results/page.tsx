"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Lock, AlertCircle, User, X, Brain, Calculator, Shapes, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { tpaAPI, paymentAPI } from '@/lib/api';
import { TpaTest, TpaTestResults } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import ApexCharts dynamically for client-side rendering
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

interface ResultsState {
  isLoading: boolean;
  testData: TpaTest | null;
  resultsData: TpaTestResults | null;
  error: string | null;
  canDownloadCertificate: boolean;
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

// TPA Reasoning Categories mapping - 4 specific dimensions with detailed descriptions
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

// New TPA Reasoning Style Section Component
const NewTpaReasoningStyleSection = ({ isPaid, handlePurchaseCertificate, isProcessingPayment, organizedScores, resultsData }: {
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
  resultsData: TpaTestResults;
}) => {
  const { result_description } = resultsData;

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
      {/* Magazine-style Background - White background with decorative elements */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Magazine decorative elements */}
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
              <div style={exclusiveBadgeStyle}>EXCLUSIVE</div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                TPA Reasoning Results + Certificate
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                Get your comprehensive reasoning profile with detailed analysis of your cognitive abilities!
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold mb-4" style={{ color: '#4A47A3' }}>Rp. 35.000</p>
              <button
                onClick={handlePurchaseCertificate}
                disabled={isProcessingPayment}
                className="w-full py-2 sm:py-3 text-base sm:text-lg text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
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

        {/* Magazine-style Header - Adapted for "Your Reasoning Profile" */}
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
              Your Reasoning Profile
            </h2>
            <h3
              className="text-3xl sm:text-4xl md:text-5xl font-bold italic leading-tight mb-3 sm:mb-4"
              style={{
                color: '#24348C',
                lineHeight: '1.2',
                margin: 0
              }}
            >
              {result_description?.title || 'Dynamic Reasoning Assessment'}
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

        {/* Average Score Card - Highlighted Below */}
        <div className="mb-8 sm:mb-12 flex justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl overflow-hidden shadow-xl border-2 border-purple-200">
              <div
                className="text-white text-center font-bold text-lg sm:text-xl leading-tight py-4 sm:py-6"
                style={{ backgroundColor: '#6B46C1' }}
              >
                Overall Reasoning Score
              </div>
              <div className="p-6 sm:p-8 text-center bg-gradient-to-br from-purple-50 to-purple-100">
                <div className="text-5xl sm:text-6xl font-bold mb-3 sm:mb-4" style={{ color: '#24348C' }}>
                  {resultsData.average_score?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm sm:text-base text-gray-600 mb-3">
                  Total Score
                </div>
                <div className="text-lg sm:text-xl font-bold px-4 py-2 rounded-lg" style={{ backgroundColor: '#6B46C1', color: 'white' }}>
                  {resultsData.dominant_reasoning_categories?.[0] || 'Balanced Reasoning'}
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
                Reasoning Profile Analysis
              </h4>
              <div className="w-full h-0.5 bg-gray-300 mb-3 sm:mb-4"></div>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#5E5E5E' }}>
                {result_description?.reasoning_profile || 'Your TPA assessment reveals unique patterns in how you approach analytical, quantitative, spatial, and verbal reasoning tasks. This comprehensive analysis provides insights into your cognitive strengths and problem-solving preferences across multiple reasoning dimensions.'}
              </p>
            </div>
          </div>
        </div>

        {/* Reasoning Development Recommendations Card */}
        <div className="mb-6 sm:mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#DFE4FF' }}>
            <div className="p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#24348C' }}>
                Reasoning Development Recommendations
              </h4>
              <div className="w-full h-0.5 mb-3 sm:mb-4" style={{ backgroundColor: '#24348C40' }}></div>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#24348CCC' }}>
                {result_description?.recommendations || 'Based on your reasoning profile, consider focusing on developing areas that complement your natural cognitive strengths. Leverage your dominant reasoning dimensions while working on improving areas where you scored lower to achieve a more balanced cognitive approach across analytical, quantitative, spatial, and verbal domains.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Payment Success Dialog Component
interface PaymentSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadCertificate: () => void;
}

const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({ isOpen, onClose, onDownloadCertificate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h3>

          <p className="text-gray-600 mb-6">
            Your TPA assessment results are now unlocked. You can download your personalized certificate.
          </p>

          <div className="space-y-3">
            <button
              onClick={onDownloadCertificate}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Download Certificate
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Continue Viewing Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Enhanced TPA Test Results Dashboard
 * Displays TPA reasoning assessment results with payment integration and certificate download
 */
const EnhancedTpaResultsDashboard = () => {
  const { user } = useAuth();
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
  const [showPaymentSuccessDialog, setShowPaymentSuccessDialog] = useState(false);

  // Payment status checking function
  const checkPaymentStatus = useCallback(async (testId: string, isAutoCheck = false) => {
    try {
      console.log(`🔍 Checking TPA payment status for test ${testId}${isAutoCheck ? ' (auto-check)' : ''}`);

      // Get auth token from cookie
      const authToken = document.cookie.split('auth_token=')[1]?.split(';')[0];
      if (!authToken) {
        console.warn('⚠️ No auth token found for payment check');
        return false;
      }

      const response = await fetch(`https://api.cakravia.com/api/v1/users/tpa_tests/${testId}/check_payment_status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💳 TPA payment status response:', data);

        if (data.data?.is_paid === true) {
          console.log('✅ TPA test is paid!');
          setIsPaid(true);

          if (isAutoCheck) {
            setShowPaymentSuccessDialog(true);
          }

          return true;
        } else {
          console.log('💰 TPA test not paid yet');
          return false;
        }
      } else {
        console.error('❌ Failed to check TPA payment status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking TPA payment status:', error);
      return false;
    }
  }, []);

  // Load Midtrans script
  useEffect(() => {
    const loadMidtransScript = () => {
      if (document.getElementById('midtrans-script')) return;

      const script = document.createElement('script');
      script.id = 'midtrans-script';
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'; // Sandbox URL - temporary
      script.setAttribute('data-client-key', 'SB-Mid-client-nKMAqVgSgOIsOQyk');
      document.head.appendChild(script);

      script.onload = () => {
        console.log('✅ Midtrans script loaded');
      };

      script.onerror = () => {
        console.error('❌ Failed to load Midtrans script');
      };
    };

    loadMidtransScript();
  }, []);

  // Enhanced openSnapPopup function with automatic status check
  const openSnapPopup = useCallback((snapToken: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('testId');

    if (window.snap) {
      window.snap.pay(snapToken, {
        onSuccess: function(result: MidtransResult) {
          console.log('💳 TPA payment successful:', result);

          // Automatically check payment status after successful payment
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking TPA payment status after success...');
              checkPaymentStatus(testId, true);
            }, 3000); // Wait 3 seconds for payment to be processed on server
          }
        },
        onPending: function(result: MidtransResult) {
          console.log('⏳ TPA payment pending:', result);

          // Also check status for pending payments (some payment methods complete quickly)
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking TPA payment status after pending...');
              checkPaymentStatus(testId, true);
            }, 5000); // Wait 5 seconds for pending payments
          }
        },
        onError: function(result: MidtransResult) {
          console.error('❌ TPA payment failed:', result);
          alert('Payment failed. Please try again or contact support if the issue persists.');
        },
        onClose: function() {
          console.log('🔒 TPA payment popup closed by user');

          // Check payment status when popup is closed (user might have completed payment)
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking TPA payment status after popup close...');
              checkPaymentStatus(testId, true);
            }, 2000); // Wait 2 seconds then check
          }
        }
      });
    } else {
      console.log('⚠️ Midtrans Snap not loaded, opening in new tab');
      if (snapUrl) {
        const paymentWindow = window.open(snapUrl, '_blank');

        // For external window, we need to poll for payment completion
        if (testId && paymentWindow) {
          // Check payment status every 10 seconds while window might be open
          const pollInterval = setInterval(() => {
            console.log('🔄 Polling TPA payment status...');
            checkPaymentStatus(testId, true).then((isPaidStatus) => {
              if (isPaidStatus) {
                clearInterval(pollInterval);
                console.log('✅ TPA payment detected via polling');
              }
            });
          }, 10000); // Check every 10 seconds

          // Stop polling after 10 minutes
          setTimeout(() => {
            clearInterval(pollInterval);
            console.log('⏰ Stopped polling for TPA payment after 10 minutes');
          }, 600000);
        }
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
        const paymentResult = await paymentAPI.initializeTpaPayment(testId);

        const snapToken = paymentResult.paymentToken.snap_token;
        const midtransResponse = JSON.parse(paymentResult.paymentToken.midtrans_response);
        const snapUrl = midtransResponse.redirect_url;
        setSnapUrl(snapUrl);

        openSnapPopup(snapToken);

      } catch (orderError: unknown) {
        // Type guard to check if it's an error with the expected structure
        const error = orderError as OrderError;

        if (error.response?.data?.code === 'ORDER_ALREADY_EXISTS') {
          console.log('📋 TPA order already exists, getting existing payment token...');

          try {
            // Get payment token for existing order
            const tokenResponse = await paymentAPI.getTpaPaymentToken(testId);
            const snapToken = tokenResponse.data.snap_token;
            const midtransResponse = JSON.parse(tokenResponse.data.midtrans_response);
            const snapUrl = midtransResponse.redirect_url;
            setSnapUrl(snapUrl);

            openSnapPopup(snapToken);

          } catch (tokenError) {
            console.error('❌ Failed to get existing TPA payment token:', tokenError);
            throw new Error('Failed to retrieve payment information. Please try again.');
          }
        } else {
          // Re-throw other errors
          throw error;
        }
      }

    } catch (error) {
      console.error('❌ TPA payment initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadCertificate = async () => {
    alert('Certificate download would start here (real implementation)');
  };

  // Load test results
  const loadResults = useCallback(async () => {
    if (!user) return;

    try {
      setResultsState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get test ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const testId = urlParams.get('testId');

      if (!testId) {
        setResultsState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Test ID not found. Cannot load results.'
        }));
        return;
      }

      console.log('Loading TPA test results for test ID:', testId);

      // Get the test results using the specific test ID
      const results = await tpaAPI.getTestResults(testId);

      console.log('Loaded TPA results data:', results.data);

      // Check payment status for this test
      await checkPaymentStatus(testId);

      setResultsState(prev => ({
        ...prev,
        isLoading: false,
        resultsData: results.data,
        canDownloadCertificate: true
      }));
    } catch (error) {
      console.error('Failed to load TPA results:', error);
      setResultsState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load results'
      }));
    }
  }, [user, checkPaymentStatus]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Create organized data for TPA reasoning categories - 4 dimensions
  const organizedScores = resultsState.resultsData ? Object.entries(TPA_CATEGORIES).map(([categoryName, info]) => {
    const score = (() => {
      switch (categoryName) {
        case 'Analytical Reasoning': return resultsState.resultsData!.analytical_reasoning_score || 0;
        case 'Quantitative Reasoning': return resultsState.resultsData!.quantitative_reasoning_score || 0;
        case 'Spatial Reasoning': return resultsState.resultsData!.spatial_reasoning_score || 0;
        case 'Verbal Reasoning': return resultsState.resultsData!.verbal_reasoning_score || 0;
        default: return 0;
      }
    })();

    const maxScore = resultsState.resultsData!.max_score || 1;
    const percentage = (score / maxScore) * 100;

    return {
      name: info.name,
      score,
      percentage,
      color: info.color,
      code: info.code
    };
  }) : [];

  if (resultsState.isLoading) {
    return (
      <div className="min-h-screen bg-[#E0E6F6] relative overflow-hidden">
        <Header currentPage="tpa-test-results" />
        <div className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your TPA reasoning results...</p>
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
        <Header currentPage="tpa-test-results" />
        <div className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Results</h2>
              <p className="text-gray-600 mb-6">
                {resultsState.error || 'No test results found. Please take the test first.'}
              </p>
              <Link
                href="/tpa-test"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Take TPA Test
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
      {/* Header */}
      <Header currentPage="tpa-test-results" />

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
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Welcome back, {user?.name || 'Student'}!</h2>
                <p className="text-gray-600 text-sm sm:text-base">Here are your TPA Assessment results</p>
              </div>
            </div>
          </div>

          {/* Top Section: Final Report */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#4A47A3' }}>
                Here is your TPA reasoning profile report
              </h1>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm" style={{ color: '#4A47A3' }}>Certificate ID: TPA-{Date.now()}</p>
                <p className="text-xs text-gray-500">Test completed: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Main content: Responsive Layout */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
              {/* Chart Section - TPA-style Radar Chart */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <Card className="rounded-lg overflow-hidden border-none shadow-lg w-full">
                  <CardHeader className="bg-[#8BC34A] text-white rounded-t-lg py-3 sm:py-4">
                    <CardTitle className="text-center text-lg sm:text-2xl font-bold" style={{ color: '#24348C' }}>
                      Reasoning Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 bg-[#F0F2F5]">
                    {/* ApexCharts Radar Chart - TPA Style */}
                    {typeof window !== 'undefined' && (
                      <ApexCharts
                        options={{
                          chart: {
                            height: 350,
                            type: "radar",
                            toolbar: {
                              show: false,
                            },
                            fontFamily: 'Merriweather Sans, sans-serif'
                          },
                          plotOptions: {
                            radar: {
                              size: 140,
                              polygons: {
                                strokeColors: '#e9e9e9',
                                fill: {
                                  colors: ['#f8f8f8', '#fff']
                                }
                              }
                            }
                          },
                          colors: ['#8979FF'],
                          markers: {
                            size: 4,
                            colors: ['#fff'],
                            strokeColor: '#8979FF',
                            strokeWidth: 2,
                          },
                          tooltip: {
                            y: {
                              formatter: function(val: number) {
                                return val.toFixed(1)
                              }
                            }
                          },
                          xaxis: {
                            categories: organizedScores.map(item => item.code),
                            labels: {
                              show: true,
                              style: {
                                colors: "#888",
                                fontSize: "12px"
                              }
                            }
                          },
                          yaxis: {
                            tickAmount: 4,
                            labels: {
                              show: true,
                              style: {
                                colors: "#888",
                                fontSize: "11px"
                              }
                            }
                          },
                          fill: {
                            opacity: 0.1
                          },
                          stroke: {
                            show: true,
                            width: 2,
                            colors: ['#8979FF'],
                            dashArray: 0
                          },
                          responsive: [
                            {
                              breakpoint: 768,
                              options: {
                                chart: {
                                  height: 300,
                                },
                                plotOptions: {
                                  radar: {
                                    size: 120
                                  }
                                }
                              },
                            },
                            {
                              breakpoint: 480,
                              options: {
                                chart: {
                                  height: 250,
                                },
                                plotOptions: {
                                  radar: {
                                    size: 100
                                  }
                                }
                              },
                            },
                          ]
                        }}
                        series={[{
                          name: 'Reasoning Scores',
                          data: organizedScores.map(item => item.score)
                        }]}
                        type="radar"
                        height={350}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Descriptions Section */}
              <div className="w-full lg:w-1/2 space-y-4 sm:space-y-6">
                {/* TPA Category Descriptions - All 4 */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {organizedScores.map((category) => {
                    const categoryInfo = TPA_CATEGORIES[category.name as keyof typeof TPA_CATEGORIES];
                    const Icon = categoryInfo?.icon || Brain;
                    return (
                      <div key={category.code} className="flex items-start gap-3">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" style={{ color: '#8BC34A' }} />
                        <div>
                          <h3 className="font-bold mb-2 text-sm sm:text-base" style={{ color: '#2A3262' }}>
                            {category.name} ({category.code})
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
                      Download TPA Certificate
                    </button>
                  ) : (
                    <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl w-full" style={{ borderColor: '#4A47A3' }}>
                      <div style={exclusiveBadgeStyle}>EXCLUSIVE</div>
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
                        {isProcessingPayment ? 'Processing...' : 'Get My Results'}
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

          {/* NEW SECTION: TPA Reasoning Style Section */}
          <NewTpaReasoningStyleSection
            isPaid={isPaid}
            handlePurchaseCertificate={handlePurchaseCertificate}
            isProcessingPayment={isProcessingPayment}
            organizedScores={organizedScores}
            resultsData={resultsState.resultsData}
          />

          {/* Test Again Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#4A47A3' }}>
                Want to retake the TPA assessment?
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Reasoning abilities can be developed over time. Take the test again to see if your cognitive profile has evolved.
              </p>
              <Link
                href="/tpa-test"
                className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm sm:text-base"
              >
                Take Test Again
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer className="relative z-10" />

      {/* Payment Success Dialog */}
      <PaymentSuccessDialog
        isOpen={showPaymentSuccessDialog}
        onClose={() => setShowPaymentSuccessDialog(false)}
        onDownloadCertificate={() => {
          setShowPaymentSuccessDialog(false);
          handleDownloadCertificate();
        }}
      />
    </div>
  );
};

export default EnhancedTpaResultsDashboard;