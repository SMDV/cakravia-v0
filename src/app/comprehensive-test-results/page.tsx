"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Lock, AlertCircle, User, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { comprehensiveAPI, paymentAPI } from '@/lib/api';
import { ComprehensiveTest, ComprehensiveTestResults as ComprehensiveTestResultsType, CouponValidationRequest, CouponValidationResponse, Coupon } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CouponModal from '@/components/payment/CouponModal';

const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

interface ResultsState {
  isLoading: boolean;
  testData: ComprehensiveTest | null;
  resultsData: ComprehensiveTestResultsType | null;
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
            Your Comprehensive assessment results are now unlocked. You can download your personalized certificate.
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

  // Enhanced payment state
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [snapUrl, setSnapUrl] = useState<string | null>(null);
  const [showPaymentSuccessDialog, setShowPaymentSuccessDialog] = useState(false);

  // Coupon modal state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Suppress unused variable warning - appliedCoupon used for future functionality
  void appliedCoupon;

  // Payment status checking function
  const checkPaymentStatus = useCallback(async (testId: string, isAutoCheck = false) => {
    try {
      console.log(`🔍 Checking Comprehensive payment status for test ${testId}${isAutoCheck ? ' (auto-check)' : ''}`);

      // Get auth token from cookie
      const authToken = document.cookie.split('auth_token=')[1]?.split(';')[0];
      if (!authToken) {
        console.warn('⚠️ No auth token found for payment check');
        return false;
      }

      const response = await fetch(`https://api.cakravia.com/api/v1/users/comprehensive_assessment_tests/${testId}/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💳 Comprehensive payment status response:', data);

        if (data.data?.is_paid === true) {
          console.log('✅ Comprehensive test is paid!');
          setIsPaid(true);

          if (isAutoCheck) {
            setShowPaymentSuccessDialog(true);
          }

          return true;
        } else {
          console.log('💰 Comprehensive test not paid yet');
          return false;
        }
      } else {
        console.error('❌ Failed to check Comprehensive payment status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking Comprehensive payment status:', error);
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
          console.log('💳 Comprehensive payment successful:', result);

          // Automatically check payment status after successful payment
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking Comprehensive payment status after success...');
              checkPaymentStatus(testId, true);
            }, 3000); // Wait 3 seconds for payment to be processed on server
          }
        },
        onPending: function(result: MidtransResult) {
          console.log('⏳ Comprehensive payment pending:', result);

          // Also check status for pending payments (some payment methods complete quickly)
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking Comprehensive payment status after pending...');
              checkPaymentStatus(testId, true);
            }, 5000); // Wait 5 seconds for pending payments
          }
        },
        onError: function(result: MidtransResult) {
          console.error('❌ Comprehensive payment failed:', result);
          alert('Payment failed. Please try again or contact support if the issue persists.');
        },
        onClose: function() {
          console.log('🔒 Comprehensive payment popup closed by user');

          // Check payment status when popup is closed (user might have completed payment)
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking Comprehensive payment status after popup close...');
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
            console.log('🔄 Polling Comprehensive payment status...');
            checkPaymentStatus(testId, true).then((isPaidStatus) => {
              if (isPaidStatus) {
                clearInterval(pollInterval);
                console.log('✅ Comprehensive payment detected via polling');
              }
            });
          }, 10000); // Check every 10 seconds

          // Stop polling after 10 minutes
          setTimeout(() => {
            clearInterval(pollInterval);
            console.log('⏰ Stopped polling for Comprehensive payment after 10 minutes');
          }, 600000);
        }
      }
    }
  }, [checkPaymentStatus, snapUrl]);

  // Handle coupon validation
  const handleValidateCoupon = async (request: CouponValidationRequest): Promise<CouponValidationResponse> => {
    try {
      const response = await paymentAPI.validateCoupon(request);
      return response.data;
    } catch (error) {
      console.error('Coupon validation failed:', error);
      throw error;
    }
  };


  // Enhanced certificate purchase handler - now opens coupon modal first
  const handlePurchaseCertificate = async () => {
    setShowCouponModal(true);
  };

  // Actual payment processing with coupon support
  const proceedToPayment = async (couponCode?: string) => {
    try {
      setIsProcessingPayment(true);

      // Get the test ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const testId = urlParams.get('testId');

      if (!testId) {
        throw new Error('Test ID not found. Cannot process payment.');
      }

      try {
        // First, try to initialize payment (create new order) with optional coupon
        const paymentResult = await paymentAPI.initializeComprehensivePayment(testId, couponCode);

        const snapToken = paymentResult.paymentToken.snap_token;
        const midtransResponse = JSON.parse(paymentResult.paymentToken.midtrans_response);
        const snapUrl = midtransResponse.redirect_url;
        setSnapUrl(snapUrl);

        openSnapPopup(snapToken);

      } catch (orderError: unknown) {
        // Type guard to check if it's an error with the expected structure
        const error = orderError as OrderError;

        if (error.response?.data?.code === 'ORDER_ALREADY_EXISTS') {
          console.log('📋 Comprehensive order already exists, getting existing payment token...');

          try {
            // Get payment token for existing order
            const tokenResponse = await paymentAPI.getComprehensivePaymentToken(testId);
            const snapToken = tokenResponse.data.snap_token;
            const midtransResponse = JSON.parse(tokenResponse.data.midtrans_response);
            const snapUrl = midtransResponse.redirect_url;
            setSnapUrl(snapUrl);

            openSnapPopup(snapToken);

          } catch (tokenError) {
            console.error('❌ Failed to get existing Comprehensive payment token:', tokenError);
            throw new Error('Failed to retrieve payment information. Please try again.');
          }
        } else {
          // Re-throw other errors
          throw error;
        }
      }

    } catch (error) {
      console.error('❌ Comprehensive payment initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadCertificate = async () => {
    alert('Comprehensive certificate download would start here');
  };

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

      console.log('Loading Comprehensive test results for test ID:', testId);

      // Get the test results using the specific test ID
      const results = await comprehensiveAPI.getTestResults(testId);

      console.log('Loaded Comprehensive results data:', results.data);

      // Check payment status for this test
      await checkPaymentStatus(testId);

      setResultsState(prev => ({
        ...prev,
        isLoading: false,
        resultsData: results.data,
        canDownloadCertificate: true
      }));
    } catch (error) {
      console.error('Failed to load Comprehensive results:', error);
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

  // Create organized data for comprehensive categories - 5 dimensions
  const organizedScores = resultsState.resultsData ? Object.entries(COMPREHENSIVE_CATEGORIES).map(([code, info]) => {
    const score = (() => {
      switch (code) {
        case 'CF': return resultsState.resultsData!.cf_score || 0;
        case 'R': return resultsState.resultsData!.r_score || 0;
        case 'MA': return resultsState.resultsData!.ma_score || 0;
        case 'AG': return resultsState.resultsData!.ag_score || 0;
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
                    {category.score?.toFixed(1) || '0.0'}
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
      <PaymentSuccessDialog
        isOpen={showPaymentSuccessDialog}
        onClose={() => setShowPaymentSuccessDialog(false)}
        onDownloadCertificate={() => {
          setShowPaymentSuccessDialog(false);
          handleDownloadCertificate();
        }}
      />

      {/* Coupon Modal */}
      <CouponModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onProceedWithoutCoupon={() => {
          setShowCouponModal(false);
          proceedToPayment();
        }}
        onProceedWithCoupon={(couponData) => {
          setAppliedCoupon(couponData.coupon);
          setShowCouponModal(false);
          proceedToPayment(couponData.coupon.code);
        }}
        originalAmount={50000}
        testType="comprehensive"
        validateCoupon={handleValidateCoupon}
      />
    </div>
  );
};

export default EnhancedComprehensiveResultsDashboard;