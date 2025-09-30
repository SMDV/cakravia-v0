"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Lock, AlertCircle, User, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { aiKnowledgeAPI, paymentAPI } from '@/lib/api';
import { AiKnowledgeTest, AiKnowledgeTestResults as AiKnowledgeTestResultsType, CouponValidationRequest, CouponValidationResponse } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CouponModal } from '@/components/payment';

// Import ApexCharts dynamically for client-side rendering
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })

interface ResultsState {
  isLoading: boolean;
  testData: AiKnowledgeTest | null;
  resultsData: AiKnowledgeTestResultsType | null;
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

// AI Knowledge Categories mapping
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
    description: 'How cost-effective you perceive AI tools to be',
    color: '#06B6D4'
  },
  HT: {
    name: 'Habit',
    description: 'How much AI usage has become a habit for you',
    color: '#84CC16'
  },
  BI: {
    name: 'Behavioral Intention',
    description: 'Your intention to continue using AI for learning',
    color: '#F97316'
  }
};



// New AI Knowledge Style Section Component (adapted from VARK)
const NewAIKnowledgeStyleSection = ({ organizedScores, resultsData }: {
  organizedScores: Array<{
    name: string;
    score: number;
    percentage: number;
    color: string;
    code: string;
  }>;
  resultsData: AiKnowledgeTestResultsType;
}) => {
  const { result_description } = resultsData;

  // Modified SmallScoreBox Component for AI Knowledge
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
        {/* Magazine-style Header - Adapted for "Your AI Readiness" */}
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
              Your AI Readiness Profile
            </h2>
            <h3
              className="text-3xl sm:text-4xl md:text-5xl font-bold italic leading-tight mb-3 sm:mb-4"
              style={{
                color: '#24348C',
                lineHeight: '1.2',
                margin: 0
              }}
            >
              {result_description?.title || 'AI-Enthusiastic Learner'}
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

        {/* Score Cards - All 8 AI Knowledge Categories */}
        <div className="mb-8 sm:mb-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

        {/* AI Readiness Description Card */}
        <div className="mb-6 sm:mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#F4F4F4EE' }}>
            <div className="p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#5E5E5E' }}>
                AI Readiness Description
              </h4>
              <div className="w-full h-0.5 bg-gray-300 mb-3 sm:mb-4"></div>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#5E5E5E' }}>
                {result_description?.description || 'You demonstrate a strong positive attitude toward AI integration in learning. Your high scores in Performance Expectancy, Hedonic Motivation, and Behavioral Intention indicate that you see significant value in AI tools and genuinely enjoy using them for educational purposes. You believe AI can enhance your academic performance and you have a strong commitment to continue using these tools.'}
              </p>
            </div>
          </div>
        </div>

        {/* AI Learning Recommendations Card */}
        <div className="mb-6 sm:mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#DFE4FF' }}>
            <div className="p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#24348C' }}>
                AI Learning Recommendations
              </h4>
              <div className="w-full h-0.5 mb-3 sm:mb-4" style={{ backgroundColor: '#24348C40' }}></div>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#24348CCC' }}>
                {result_description?.recommendations || 'Continue exploring advanced AI tools and consider becoming an AI learning advocate in your academic community. Focus on developing consistent habits around AI usage to maximize the benefits. Consider sharing your positive experiences with peers to help build a supportive AI learning community.'}
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
            Your AI Knowledge assessment results are now unlocked. You can download your personalized certificate.
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

const EnhancedAIKnowledgeResultsDashboard = () => {
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
  const [isSnapOpen, setIsSnapOpen] = useState(false);

  // Coupon modal state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);

  // Suppress unused variable warning - appliedCoupon used for future functionality
  void appliedCoupon;

  // Payment status checking function
  const checkPaymentStatus = useCallback(async (testId: string, isAutoCheck = false) => {
    try {
      console.log(`🔍 Checking AI Knowledge payment status for test ${testId}${isAutoCheck ? ' (auto-check)' : ''}`);

      // Get auth token from cookie
      const authToken = document.cookie.split('auth_token=')[1]?.split(';')[0];
      if (!authToken) {
        console.warn('⚠️ No auth token found for payment check');
        return false;
      }

      const response = await fetch(`https://api.cakravia.com/api/v1/users/ai_knowledge_tests/${testId}/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💳 AI Knowledge payment status response:', data);

        const order = data.data;
        const hasValidPayment = order?.status === 'paid' && order?.can_download_certificate === true;

        if (hasValidPayment) {
          console.log('✅ AI Knowledge test is paid!');
          setIsPaid(true);
          setResultsState(prev => ({ ...prev, canDownloadCertificate: true }));

          if (isAutoCheck) {
            setShowPaymentSuccessDialog(true);
          }

          return true;
        } else {
          console.log('❌ AI Knowledge payment not completed yet. Status:', order?.status);
          setIsPaid(false);
          setResultsState(prev => ({ ...prev, canDownloadCertificate: false }));
          return false;
        }
      } else {
        console.error('❌ Failed to check AI Knowledge payment status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking AI Knowledge payment status:', error);
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
      setIsSnapOpen(true);
      window.snap.pay(snapToken, {
        onSuccess: function(result: MidtransResult) {
          console.log('💳 AI Knowledge payment successful:', result);
          setIsSnapOpen(false);

          // Automatically check payment status after successful payment
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking AI Knowledge payment status after success...');
              checkPaymentStatus(testId, true);
            }, 3000); // Wait 3 seconds for payment to be processed on server
          }
        },
        onPending: function(result: MidtransResult) {
          console.log('⏳ AI Knowledge payment pending:', result);
          setIsSnapOpen(false);

          // Also check status for pending payments (some payment methods complete quickly)
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking AI Knowledge payment status after pending...');
              checkPaymentStatus(testId, true);
            }, 5000); // Wait 5 seconds for pending payments
          }
        },
        onError: function(result: MidtransResult) {
          console.error('❌ AI Knowledge payment failed:', result);
          setIsSnapOpen(false);
          alert('Payment failed. Please try again or contact support if the issue persists.');
        },
        onClose: function() {
          console.log('🔒 AI Knowledge payment popup closed by user');
          setIsSnapOpen(false);

          // Check payment status when popup is closed (user might have completed payment)
          if (testId) {
            setTimeout(() => {
              console.log('🔄 Auto-checking AI Knowledge payment status after popup close...');
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
            console.log('🔄 Polling AI Knowledge payment status...');
            checkPaymentStatus(testId, true).then((isPaidStatus) => {
              if (isPaidStatus) {
                clearInterval(pollInterval);
                console.log('✅ AI Knowledge payment detected via polling');
              }
            });
          }, 10000); // Check every 10 seconds

          // Stop polling after 10 minutes
          setTimeout(() => {
            clearInterval(pollInterval);
            console.log('⏰ Stopped polling for AI Knowledge payment after 10 minutes');
          }, 600000);
        }
      }
    }
  }, [checkPaymentStatus, snapUrl]);

  // Coupon validation handler
  const handleValidateCoupon = useCallback(async (request: CouponValidationRequest): Promise<CouponValidationResponse> => {
    try {
      const response = await paymentAPI.validateCoupon(request);
      return response.data;
    } catch (error) {
      console.error('Coupon validation error:', error);
      // Return invalid coupon response
      return {
        valid: false,
        message: 'Failed to validate coupon. Please try again.',
        coupon: {
          code: request.coupon_code,
          discount_type: 'percentage',
          display_discount: '0%'
        },
        pricing: {
          original_amount: parseFloat(request.amount),
          discount_amount: '0',
          final_amount: request.amount
        }
      };
    }
  }, []);

  // Coupon modal handlers
  const handleOpenCouponModal = () => {
    setShowCouponModal(true);
  };

  const handleCloseCouponModal = () => {
    setShowCouponModal(false);
    setAppliedCoupon(null);
  };

  const handleProceedWithoutCoupon = () => {
    setShowCouponModal(false);
    setAppliedCoupon(null);
    proceedToPayment();
  };

  const handleProceedWithCoupon = (couponData: CouponValidationResponse) => {
    setAppliedCoupon(couponData);
    setShowCouponModal(false);
    proceedToPayment(couponData.coupon.code);
  };

  // Actual payment processing function
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
        // Initialize payment with optional coupon
        const paymentResult = await paymentAPI.initializeAiKnowledgePayment(testId, couponCode);

        const snapToken = paymentResult.paymentToken.snap_token;
        const midtransResponse = JSON.parse(paymentResult.paymentToken.midtrans_response);
        const snapUrl = midtransResponse.redirect_url;
        setSnapUrl(snapUrl);

        openSnapPopup(snapToken);

      } catch (orderError: unknown) {
        // Handle existing order logic (same as before)
        const isOrderError = (error: unknown): error is OrderError => {
          return typeof error === 'object' &&
                 error !== null &&
                 'response' in error;
        };

        if (isOrderError(orderError) &&
            orderError.response?.data?.code === 'existing_order') {

          console.log('📦 Order already exists, getting payment token...');

          try {
            const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/ai_knowledge_tests/${testId}/orders/payment_token`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]?.split(';')[0]}`,
                'Content-Type': 'application/json'
              }
            });

            if (!tokenResponse.ok) {
              const errorData = await tokenResponse.json().catch(() => ({}));
              throw new Error(errorData.message || `Failed to get payment token: ${tokenResponse.status}`);
            }

            const tokenData = await tokenResponse.json();

            const midtransResponse = JSON.parse(tokenData.data.midtrans_response);
            const snapUrl = midtransResponse.redirect_url;
            setSnapUrl(snapUrl);

            openSnapPopup(tokenData.data.snap_token);

          } catch (tokenError) {
            const tokenErrorMessage = tokenError instanceof Error ? tokenError.message : 'Failed to get payment token';
            throw new Error(`Could not retrieve payment token: ${tokenErrorMessage}`);
          }

        } else {
          throw orderError;
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
      console.error('💳 Payment error:', error);
      alert(`Payment failed: ${errorMessage}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Enhanced certificate purchase handler - now opens coupon modal first
  const handlePurchaseCertificate = async () => {
    try {
      setIsProcessingPayment(true);

      // Get the test ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const testId = urlParams.get('testId');

      if (!testId) {
        throw new Error('Test ID not found. Cannot process payment.');
      }

      // First, check if there's an existing order
      try {
        console.log('🔍 Checking for existing AI Knowledge order...');
        const existingOrderResponse = await paymentAPI.getAiKnowledgeOrder(testId);
        const existingOrder = existingOrderResponse.data;

        console.log('📊 Existing AI Knowledge order found:', existingOrder);

        // If order exists and is still pending (not expired)
        if (existingOrder && existingOrder.status === 'pending') {
          console.log('✅ Found pending AI Knowledge order, proceeding directly to payment...');

          // Get payment token for existing order and proceed to Midtrans
          const tokenResponse = await paymentAPI.getAiKnowledgePaymentToken(testId);
          const snapToken = tokenResponse.data.snap_token;
          const midtransResponse = JSON.parse(tokenResponse.data.midtrans_response);
          const snapUrl = midtransResponse.redirect_url;
          setSnapUrl(snapUrl);

          openSnapPopup(snapToken);
          return;
        } else if (existingOrder && existingOrder.status === 'paid') {
          console.log('💰 AI Knowledge order already paid, updating UI...');
          setIsPaid(true);
          setResultsState(prev => ({ ...prev, canDownloadCertificate: true }));
          return;
        } else {
          console.log('📝 No pending AI Knowledge order found, showing coupon modal...');
        }
      } catch (orderError) {
        // If no order exists (404), that's expected - continue with coupon modal
        console.log('ℹ️ No existing AI Knowledge order found, proceeding with new order flow...', orderError);
      }

      // If no existing pending order, show coupon modal for new order
      handleOpenCouponModal();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check existing order';
      console.error('❌ Error checking existing AI Knowledge order:', error);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Original certificate purchase handler with existing order check
  // Commented out to avoid unused variable warning - kept for reference
  /*
  // Original handler - commented out to avoid unused variable warning
  const originalHandlePurchaseCertificate = async () => {
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
        const paymentResult = await paymentAPI.initializeAiKnowledgePayment(testId);

        const snapToken = paymentResult.paymentToken.snap_token;
        const midtransResponse = JSON.parse(paymentResult.paymentToken.midtrans_response);
        const snapUrl = midtransResponse.redirect_url;
        setSnapUrl(snapUrl);

        openSnapPopup(snapToken);

      } catch (orderError: unknown) {
        // Type guard to check if it's an error with the expected structure
        const error = orderError as OrderError;

        if (error.response?.data?.code === 'ORDER_ALREADY_EXISTS') {
          console.log('📋 AI Knowledge order already exists, getting existing payment token...');

          try {
            // Get payment token for existing order
            const tokenResponse = await paymentAPI.getAiKnowledgePaymentToken(testId);
            const snapToken = tokenResponse.data.snap_token;
            const midtransResponse = JSON.parse(tokenResponse.data.midtrans_response);
            const snapUrl = midtransResponse.redirect_url;
            setSnapUrl(snapUrl);

            openSnapPopup(snapToken);

          } catch (tokenError) {
            console.error('❌ Failed to get existing AI Knowledge payment token:', tokenError);
            throw new Error('Failed to retrieve payment information. Please try again.');
          }
        } else {
          // Re-throw other errors
          throw error;
        }
      }

    } catch (error) {
      console.error('❌ AI Knowledge payment initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };
  */

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

      // Make API call to download AI Knowledge certificate
      const response = await fetch(`https://api.cakravia.com/api/v1/users/ai_knowledge_tests/${testId}/orders/download_certificate`, {
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
        link.download = `AI_Knowledge_Certificate_${testId.slice(0, 8)}.pdf`;
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
      console.error('AI Knowledge certificate download error:', error);
      alert(`Download failed: ${errorMessage}`);
    }
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

      console.log('Loading AI Knowledge test results for test ID:', testId);

      // Get the test results using the specific test ID
      const results = await aiKnowledgeAPI.getTestResults(testId);

      console.log('Loaded AI Knowledge results data:', results.data);

      // Check payment status for this test
      await checkPaymentStatus(testId);

      setResultsState(prev => ({
        ...prev,
        isLoading: false,
        resultsData: results.data,
        canDownloadCertificate: true
      }));
    } catch (error) {
      console.error('Failed to load AI Knowledge results:', error);
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

  // Create organized data for AI knowledge categories
  const organizedScores = resultsState.resultsData ? Object.entries(AI_KNOWLEDGE_CATEGORIES).map(([code, info]) => {
    const score = (() => {
      switch (code) {
        case 'PE': return resultsState.resultsData!.pe_score || 0;
        case 'EE': return resultsState.resultsData!.ee_score || 0;
        case 'SI': return resultsState.resultsData!.si_score || 0;
        case 'FC': return resultsState.resultsData!.fc_score || 0;
        case 'HM': return resultsState.resultsData!.hm_score || 0;
        case 'PV': return resultsState.resultsData!.pv_score || 0;
        case 'HT': return resultsState.resultsData!.ht_score || 0;
        case 'BI': return resultsState.resultsData!.bi_score || 0;
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
        <Header currentPage="ai-knowledge-test-results" />
        <div className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your results...</p>
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
        <Header currentPage="ai-knowledge-test-results" />
        <div className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Results</h2>
              <p className="text-gray-600 mb-6">
                {resultsState.error || 'No test results found. Please take the test first.'}
              </p>
              <Link
                href="/ai-knowledge-test"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Take AI Knowledge Test
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
      <Header currentPage="ai-knowledge-test-results" />

      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-auto opacity-30 z-0 pointer-events-none">
        <div className="w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-full h-auto opacity-50 z-0 pointer-events-none">
        <div className="w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-green-400 to-blue-400 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          {/* Full-page blur overlay for unpaid users */}
          {!isPaid && (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl max-w-sm w-full" style={{ borderColor: '#4A47A3' }}>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                  AI Knowledge Results + Certificate
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                  Get your AI knowledge profile with expert-backed insights
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

          {/* User Welcome Section */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Welcome back, {user?.name || 'Student'}!</h2>
                <p className="text-gray-600 text-sm sm:text-base">Here are your AI Knowledge Assessment results</p>
              </div>
            </div>
          </div>


          {/* Top Section: Final Report */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#4A47A3' }}>
                Here is your AI readiness report
              </h1>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm" style={{ color: '#4A47A3' }}>Certificate ID: AI-{Date.now()}</p>
                <p className="text-xs text-gray-500">Test completed: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Main content: Responsive Layout */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
              {/* Chart Section - Spider/Radar Chart */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <Card className="rounded-lg overflow-hidden border-none shadow-lg w-full">
                  <CardHeader className="bg-[#8BC34A] text-white rounded-t-lg py-3 sm:py-4">
                    <CardTitle className="text-center text-lg sm:text-2xl font-bold" style={{ color: '#24348C' }}>
                      AI Knowledge Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 bg-[#F0F2F5]">
                    {/* ApexCharts Radar Chart */}
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
                          xaxis: {
                            categories: organizedScores.map(item => item.code)
                          },
                          yaxis: {
                            min: 0,
                            max: resultsState.resultsData?.max_score || 5,
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
                          },
                          responsive: [
                            {
                              breakpoint: 768,
                              options: {
                                chart: {
                                  height: 300,
                                },
                              },
                            },
                            {
                              breakpoint: 480,
                              options: {
                                chart: {
                                  height: 250,
                                },
                              },
                            },
                          ]
                        }}
                        series={[{
                          name: 'AI Knowledge Scores',
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
                {/* AI Knowledge Category Descriptions - All 8 in Two Columns */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                  {organizedScores.map((category) => (
                    <div key={category.code} className="flex items-start gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" style={{ color: '#8BC34A' }} />
                      <div>
                        <h3 className="font-bold mb-2 text-sm sm:text-base" style={{ color: '#2A3262' }}>
                          {category.name} ({category.code})
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-700">
                          {AI_KNOWLEDGE_CATEGORIES[category.code as keyof typeof AI_KNOWLEDGE_CATEGORIES]?.description}
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
                      Download AI Knowledge Certificate
                    </button>
                  ) : (
                    <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl w-full" style={{ borderColor: '#4A47A3' }}>
                              <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                        AI Knowledge Results + Certificate
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                        Get your AI readiness profile with expert-backed strategies
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

          {/* NEW SECTION: AI Knowledge Style Section */}
          <NewAIKnowledgeStyleSection
            organizedScores={organizedScores}
            resultsData={resultsState.resultsData}
          />

          {/* Test Again Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#4A47A3' }}>
                Want to retake the AI knowledge assessment?
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                AI attitudes can evolve over time. Take the test again to see if your AI readiness has changed.
              </p>
              <Link
                href="/ai-knowledge-test"
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

      {/* Coupon Modal */}
      <CouponModal
        isOpen={showCouponModal}
        onClose={handleCloseCouponModal}
        onProceedWithoutCoupon={handleProceedWithoutCoupon}
        onProceedWithCoupon={handleProceedWithCoupon}
        originalAmount={30000}
        testType="ai_knowledge"
        validateCoupon={handleValidateCoupon}
      />

      {/* Backdrop Blur for Snap Payment Popup */}
      {isSnapOpen && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 z-40" />
      )}
    </div>
  );
};

export default EnhancedAIKnowledgeResultsDashboard;