"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Lock, AlertCircle, User, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { behavioralAPI, paymentAPI } from '@/lib/api';
import { BehavioralTest, BehavioralTestResults as BehavioralTestResultsType } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import ApexCharts dynamically for client-side rendering
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

interface ResultsState {
  isLoading: boolean;
  testData: BehavioralTest | null;
  resultsData: BehavioralTestResultsType | null;
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

// Behavioral Categories mapping - 4 specific dimensions with detailed descriptions
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

// New Behavioral Style Section Component (adapted from AI Knowledge)
const NewBehavioralStyleSection = ({ isPaid, handlePurchaseCertificate, isProcessingPayment, organizedScores, resultsData }: {
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
  resultsData: BehavioralTestResultsType;
}) => {
  const { result_description } = resultsData;

  // Modified SmallScoreBox Component for Behavioral Test
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
                Behavioral Results + Certificate
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                Get your exclusive behavioral profile with expert-backed insights tailored just for you!
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold mb-4" style={{ color: '#4A47A3' }}>Rp. 30.000</p>
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

        {/* Magazine-style Header - Adapted for "Your Behavioral Profile" */}
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
              {result_description?.title || 'Dynamic Behavioral Profile'}
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
                color={scoreData.color || '#4A47A3'}
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
                  {resultsData.average_score?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm sm:text-base text-gray-600 mb-3">
                  Skor Keseluruhan
                </div>
                <div className="text-lg sm:text-xl font-bold px-4 py-2 rounded-lg" style={{ backgroundColor: '#6B46C1', color: 'white' }}>
                  {resultsData.level_label}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Behavioral Profile Description Card */}
        <div className="mb-6 sm:mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#F4F4F4EE' }}>
            <div className="p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#5E5E5E' }}>
                Behavioral Profile Description
              </h4>
              <div className="w-full h-0.5 bg-gray-300 mb-3 sm:mb-4"></div>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#5E5E5E' }}>
                {result_description?.description || 'Your behavioral assessment reveals unique patterns in how you approach tasks, interact with others, and respond to various situations. This comprehensive analysis provides insights into your behavioral tendencies and preferences across multiple dimensions.'}
              </p>
            </div>
          </div>
        </div>

        {/* Behavioral Recommendations Card */}
        <div className="mb-6 sm:mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#DFE4FF' }}>
            <div className="p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#24348C' }}>
                Behavioral Development Recommendations
              </h4>
              <div className="w-full h-0.5 mb-3 sm:mb-4" style={{ backgroundColor: '#24348C40' }}></div>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#24348CCC' }}>
                {result_description?.recommendations || 'Based on your behavioral profile, consider focusing on developing areas that complement your natural strengths. Leverage your dominant behavioral dimensions while working on improving areas where you scored lower to achieve a more balanced behavioral approach.'}
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
            Your Behavioral assessment results are now unlocked. You can download your personalized certificate.
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
 * Enhanced Behavioral Test Results Dashboard
 * Displays behavioral assessment results with payment integration and certificate download
 */
const EnhancedBehavioralResultsDashboard = () => {
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
      console.log(`🔍 Checking Behavioral payment status for test ${testId}${isAutoCheck ? ' (auto-check)' : ''}`);

      // Get auth token from cookie
      const authToken = document.cookie.split('auth_token=')[1]?.split(';')[0];
      if (!authToken) {
        console.warn('⚠️ No auth token found for payment check');
        return false;
      }

      const response = await fetch(`https://api.cakravia.com/api/v1/users/behavioral_learning_tests/${testId}/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💳 Behavioral payment status response:', data);

        if (data.data?.is_paid === true) {
          console.log('✅ Behavioral test is paid!');
          setIsPaid(true);

          if (isAutoCheck) {
            setShowPaymentSuccessDialog(true);
          }

          return true;
        } else {
          console.log('💰 Behavioral test not paid yet');
          return false;
        }
      } else {
        console.error('❌ Failed to check Behavioral payment status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking Behavioral payment status:', error);
      return false;
    }
  }, []);

  // Load Midtrans script
  useEffect(() => {
    const loadMidtransScript = () => {
      if (document.getElementById('midtrans-script')) return;

      const script = document.createElement('script');
      script.id = 'midtrans-script';
      // script.src = 'https://app.midtrans.com/snap/snap.js'; // Production URL - TODO: use this for production
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
          console.log('💳 Behavioral payment successful:', result);

          // Automatically check payment status after successful payment
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking Behavioral payment status after success...');
              checkPaymentStatus(testId, true);
            }, 3000); // Wait 3 seconds for payment to be processed on server
          }
        },
        onPending: function(result: MidtransResult) {
          console.log('⏳ Behavioral payment pending:', result);

          // Also check status for pending payments (some payment methods complete quickly)
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking Behavioral payment status after pending...');
              checkPaymentStatus(testId, true);
            }, 5000); // Wait 5 seconds for pending payments
          }
        },
        onError: function(result: MidtransResult) {
          console.error('❌ Behavioral payment failed:', result);
          alert('Payment failed. Please try again or contact support if the issue persists.');
        },
        onClose: function() {
          console.log('🔒 Behavioral payment popup closed by user');

          // Check payment status when popup is closed (user might have completed payment)
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking Behavioral payment status after popup close...');
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
            console.log('🔄 Polling Behavioral payment status...');
            checkPaymentStatus(testId, true).then((isPaidStatus) => {
              if (isPaidStatus) {
                clearInterval(pollInterval);
                console.log('✅ Behavioral payment detected via polling');
              }
            });
          }, 10000); // Check every 10 seconds

          // Stop polling after 10 minutes
          setTimeout(() => {
            clearInterval(pollInterval);
            console.log('⏰ Stopped polling for Behavioral payment after 10 minutes');
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
        const paymentResult = await paymentAPI.initializeBehavioralPayment(testId);

        const snapToken = paymentResult.paymentToken.snap_token;
        const midtransResponse = JSON.parse(paymentResult.paymentToken.midtrans_response);
        const snapUrl = midtransResponse.redirect_url;
        setSnapUrl(snapUrl);

        openSnapPopup(snapToken);

      } catch (orderError: unknown) {
        // Type guard to check if it's an error with the expected structure
        const error = orderError as OrderError;

        if (error.response?.data?.code === 'ORDER_ALREADY_EXISTS') {
          console.log('📋 Behavioral order already exists, getting existing payment token...');

          try {
            // Get payment token for existing order
            const tokenResponse = await paymentAPI.getBehavioralPaymentToken(testId);
            const snapToken = tokenResponse.data.snap_token;
            const midtransResponse = JSON.parse(tokenResponse.data.midtrans_response);
            const snapUrl = midtransResponse.redirect_url;
            setSnapUrl(snapUrl);

            openSnapPopup(snapToken);

          } catch (tokenError) {
            console.error('❌ Failed to get existing Behavioral payment token:', tokenError);
            throw new Error('Failed to retrieve payment information. Please try again.');
          }
        } else {
          // Re-throw other errors
          throw error;
        }
      }

    } catch (error) {
      console.error('❌ Behavioral payment initialization failed:', error);
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

      console.log('Loading Behavioral test results for test ID:', testId);

      // Get the test results using the specific test ID
      const results = await behavioralAPI.getTestResults(testId);

      console.log('Loaded Behavioral results data:', results.data);

      // Check payment status for this test
      await checkPaymentStatus(testId);

      setResultsState(prev => ({
        ...prev,
        isLoading: false,
        resultsData: results.data,
        canDownloadCertificate: true
      }));
    } catch (error) {
      console.error('Failed to load Behavioral results:', error);
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

  // Create organized data for behavioral categories - 4 dimensions
  const organizedScores = resultsState.resultsData ? Object.entries(BEHAVIORAL_CATEGORIES).map(([code, info]) => {
    const score = (() => {
      switch (code) {
        case 'H': return resultsState.resultsData!.h_score || 0;
        case 'M': return resultsState.resultsData!.m_score || 0;
        case 'R': return resultsState.resultsData!.r_score || 0;
        case 'E': return resultsState.resultsData!.e_score || 0;
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
      code
    };
  }) : [];

  if (resultsState.isLoading) {
    return (
      <div className="min-h-screen bg-[#E0E6F6] relative overflow-hidden">
        <Header currentPage="behavioral-test-results" />
        <div className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your behavioral results...</p>
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
        <Header currentPage="behavioral-test-results" />
        <div className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Results</h2>
              <p className="text-gray-600 mb-6">
                {resultsState.error || 'No test results found. Please take the test first.'}
              </p>
              <Link
                href="/behavioral-test"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Take Behavioral Test
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
      <Header currentPage="behavioral-test-results" />

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
                <p className="text-gray-600 text-sm sm:text-base">Here are your Behavioral Assessment results</p>
              </div>
            </div>
          </div>

          {/* Top Section: Final Report */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#4A47A3' }}>
                Here is your behavioral profile report
              </h1>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm" style={{ color: '#4A47A3' }}>Certificate ID: BEH-{Date.now()}</p>
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
                {/* Behavioral Category Descriptions - All 4 */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {organizedScores.map((category) => (
                    <div key={category.code} className="flex items-start gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" style={{ color: '#8BC34A' }} />
                      <div>
                        <h3 className="font-bold mb-2 text-sm sm:text-base" style={{ color: '#2A3262' }}>
                          {category.name} ({category.code})
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-700">
                          {BEHAVIORAL_CATEGORIES[category.code as keyof typeof BEHAVIORAL_CATEGORIES]?.description}
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
                      Download Behavioral Certificate
                    </button>
                  ) : (
                    <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl w-full" style={{ borderColor: '#4A47A3' }}>
                      <div style={exclusiveBadgeStyle}>EXCLUSIVE</div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                        Behavioral Results + Certificate
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                        Get your exclusive behavioral profile with expert-backed insights
                      </p>
                      <p className="text-2xl sm:text-3xl font-extrabold mb-4" style={{ color: '#4A47A3' }}>Rp. 30.000</p>
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

          {/* NEW SECTION: Behavioral Style Section */}
          <NewBehavioralStyleSection
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
                Want to retake the behavioral assessment?
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Behavioral patterns can evolve over time. Take the test again to see if your profile has changed.
              </p>
              <Link
                href="/behavioral-test"
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

export default EnhancedBehavioralResultsDashboard;