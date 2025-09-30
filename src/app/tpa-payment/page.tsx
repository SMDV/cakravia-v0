"use client"

import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Check,
  Clock,
  AlertCircle,
  ArrowRight,
  Star,
  Shield,
  Award,
  Brain,
  Calculator,
  Eye,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { tpaAPI, paymentAPI } from '@/lib/api';
import { TpaQuestionSet, CouponValidationResponse, CouponValidationRequest } from '@/lib/types';
import { CouponModal } from '@/components/payment';

// Midtrans result types
interface MidtransResult {
  transaction_id: string;
  payment_type: string;
  status_message: string;
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

interface PaymentState {
  step: 'loading' | 'ready' | 'processing' | 'success' | 'error';
  questionSet: TpaQuestionSet | null;
  error: string | null;
  orderId: string | null;
}

/**
 * TPA Payment Landing Page Component
 * Handles the payment-first flow for TPA Assessment
 */
const TpaPaymentLanding = () => {
  const { isAuthenticated } = useAuth();

  const [paymentState, setPaymentState] = useState<PaymentState>({
    step: 'loading',
    questionSet: null,
    error: null,
    orderId: null
  });

  // Coupon modal state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const TPA_PRICE = 50000; // 50,000 IDR

  // Initialize payment landing - get question set info
  const initializePaymentLanding = useCallback(async () => {
    if (!isAuthenticated) {
      setPaymentState(prev => ({
        ...prev,
        step: 'error',
        error: 'Please login to access the TPA Assessment'
      }));
      return;
    }

    try {
      setPaymentState(prev => ({ ...prev, step: 'loading' }));

      // Get active question set for display
      const questionSetResponse = await tpaAPI.getActiveQuestionSet();
      const questionSet = questionSetResponse.data;

      setPaymentState(prev => ({
        ...prev,
        step: 'ready',
        questionSet,
        error: null
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load TPA Assessment information';
      setPaymentState(prev => ({
        ...prev,
        step: 'error',
        error: errorMessage
      }));
    }
  }, [isAuthenticated]);

  // Load Midtrans snap script
  useEffect(() => {
    const snapScript = 'https://app.sandbox.midtrans.com/snap/snap.js';
    // Use hardcoded sandbox client key (matching other test pages)
    const clientKey = 'SB-Mid-client-BnZAW_h-FqRtI-kz';

    const script = document.createElement('script');
    script.src = snapScript;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Check payment status function (like VARK)
  const checkPaymentStatus = useCallback(async (orderId: string) => {
    try {
      console.log('🔍 Checking payment status for order:', orderId);

      const orderResponse = await paymentAPI.getStandaloneOrder(orderId);
      const order = orderResponse.data as { status?: string };

      const isPaid = order.status === 'paid';

      if (isPaid) {
        console.log('✅ Payment verified - order is paid');
        setPaymentState(prev => ({ ...prev, step: 'success' }));
      } else {
        console.log('⚠️ Payment not confirmed yet. Status:', order.status);
      }

      return isPaid;
    } catch (error) {
      console.error('❌ Payment status check failed:', error);
      return false;
    }
  }, []);

  // Coupon validation handler
  const handleValidateCoupon = useCallback(async (request: CouponValidationRequest): Promise<CouponValidationResponse> => {
    try {
      const response = await paymentAPI.validateCoupon(request);
      return response.data;
    } catch (error) {
      console.error('Coupon validation error:', error);
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

  // Main payment processing
  const proceedToPayment = async (couponCode?: string) => {
    try {
      setIsProcessingPayment(true);
      setPaymentState(prev => ({ ...prev, step: 'processing' }));

      console.log('🔄 Starting TPA payment flow...', couponCode ? `with coupon: ${couponCode}` : '');

      // Create order with optional coupon
      const orderResponse = await paymentAPI.createTpaStandaloneOrder(couponCode);
      const order = orderResponse.data;

      console.log('✅ TPA order created:', order);

      // Get payment token using standalone order endpoint (NEW API)
      const orderData = order as { id: string };
      const tokenResponse = await paymentAPI.getStandaloneOrderPaymentToken(orderData.id);
      const paymentToken = tokenResponse.data;

      const snapToken = paymentToken.snap_token;
      setPaymentState(prev => ({ ...prev, orderId: orderData.id }));

      // Open Midtrans snap popup
      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: (result) => {
            console.log('✅ Payment successful callback received:', result);
            setIsProcessingPayment(false);

            // Check payment status after successful payment (like VARK)
            setTimeout(() => {
              console.log('🔄 Auto-checking payment status after success...');
              checkPaymentStatus(orderData.id);
            }, 3000); // Wait 3 seconds for payment to be processed on server
          },
          onPending: (result) => {
            console.log('⏳ Payment pending callback received:', result);
            setIsProcessingPayment(false);

            // Check status for pending payments (like VARK)
            setTimeout(() => {
              console.log('🔄 Auto-checking payment status after pending...');
              checkPaymentStatus(orderData.id);
            }, 5000); // Wait 5 seconds for pending payments
          },
          onError: (result) => {
            console.error('❌ Payment error:', result);
            setPaymentState(prev => ({
              ...prev,
              step: 'error',
              error: 'Payment failed. Please try again.'
            }));
            setIsProcessingPayment(false);
          },
          onClose: () => {
            console.log('🔄 Payment popup closed by user');
            setIsProcessingPayment(false);

            // Check payment status when popup is closed (user might have completed payment)
            setTimeout(() => {
              console.log('🔄 Auto-checking payment status after popup close...');
              checkPaymentStatus(orderData.id);
            }, 2000); // Wait 2 seconds then check
          }
        });
      } else {
        throw new Error('Payment system not ready. Please refresh and try again.');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
      console.error('❌ Payment flow error:', errorMessage);
      setPaymentState(prev => ({
        ...prev,
        step: 'error',
        error: errorMessage
      }));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Format time helper
  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Initialize on mount
  useEffect(() => {
    initializePaymentLanding();
  }, [initializePaymentLanding]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4 text-yellow-700">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please login to access the TPA Assessment</p>
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

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <div className="flex-shrink-0">
        <Header currentPage="tpa-test" />
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">

          {paymentState.step === 'loading' && (
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold mb-2">Loading TPA Assessment...</h2>
                <p className="text-gray-600">Preparing your assessment information</p>
              </div>
            </div>
          )}

          {paymentState.step === 'ready' && paymentState.questionSet && (
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="text-center bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                    <Brain className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#2A3262' }}>
                  TPA Assessment
                </h1>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  Test of Potential Ability - Comprehensive reasoning assessment across 4 key cognitive dimensions
                </p>
                <div className="flex justify-center items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(paymentState.questionSet.time_limit)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {paymentState.questionSet.total_questions} Questions
                  </span>
                </div>
              </div>

              {/* Test Categories */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <Brain className="w-8 h-8 text-purple-500" />
                    <h3 className="font-semibold text-gray-900">Analytical</h3>
                  </div>
                  <p className="text-sm text-gray-600">Logical analysis and problem-solving abilities</p>
                  <div className="text-xs text-gray-500 mt-2">5 Questions</div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <Calculator className="w-8 h-8 text-green-500" />
                    <h3 className="font-semibold text-gray-900">Quantitative</h3>
                  </div>
                  <p className="text-sm text-gray-600">Mathematical and numerical reasoning skills</p>
                  <div className="text-xs text-gray-500 mt-2">5 Questions</div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <Eye className="w-8 h-8 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">Spatial</h3>
                  </div>
                  <p className="text-sm text-gray-600">Visual-spatial relationships and patterns</p>
                  <div className="text-xs text-gray-500 mt-2">5 Questions</div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageSquare className="w-8 h-8 text-orange-500" />
                    <h3 className="font-semibold text-gray-900">Verbal</h3>
                  </div>
                  <p className="text-sm text-gray-600">Language comprehension and reasoning</p>
                  <div className="text-xs text-gray-500 mt-2">5 Questions</div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#2A3262' }}>
                  Assessment Features
                </h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <Star className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Professional Analysis</h3>
                    <p className="text-sm text-gray-600">Comprehensive scoring across multiple reasoning dimensions</p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Secure Testing</h3>
                    <p className="text-sm text-gray-600">Timed assessment with progress tracking and validation</p>
                  </div>
                  <div className="text-center">
                    <Award className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Official Certificate</h3>
                    <p className="text-sm text-gray-600">Downloadable certificate upon completion</p>
                  </div>
                </div>
              </div>

              {/* Pricing and Purchase */}
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#2A3262' }}>
                  Get Your TPA Assessment
                </h2>
                <div className="text-4xl font-bold mb-2" style={{ color: '#ABD305' }}>
                  {formatCurrency(appliedCoupon ? parseFloat(appliedCoupon.pricing.final_amount) : TPA_PRICE)}
                </div>
                {appliedCoupon && (
                  <div className="text-sm text-green-600 mb-4">
                    You save {formatCurrency(parseFloat(appliedCoupon.pricing.discount_amount))} with coupon {appliedCoupon.coupon.code}!
                  </div>
                )}
                <p className="text-gray-600 mb-8">
                  Complete assessment with detailed results and official certificate
                </p>
                <button
                  onClick={handleOpenCouponModal}
                  disabled={isProcessingPayment}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-lg"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Purchase Test Access
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  Payment required before taking the assessment
                </p>
              </div>
            </div>
          )}

          {paymentState.step === 'processing' && (
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
                <p className="text-gray-600">Please complete your payment in the popup window</p>
              </div>
            </div>
          )}

          {paymentState.step === 'success' && (
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4 text-green-700">Payment Successful!</h2>
                <p className="text-gray-600 mb-6">
                  Your TPA Assessment access has been activated. Click below to start your test.
                </p>
                <button
                  onClick={() => window.location.href = `/tpa-test?orderId=${paymentState.orderId}`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg"
                >
                  Start TPA Assessment
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  You have {formatDuration(paymentState.questionSet?.time_limit || 3600)} to complete the test
                </p>
              </div>
            </div>
          )}

          {paymentState.step === 'error' && (
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4 text-red-700">Something went wrong</h2>
                <p className="text-gray-600 mb-6">{paymentState.error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coupon Modal */}
      <CouponModal
        isOpen={showCouponModal}
        onClose={handleCloseCouponModal}
        onProceedWithoutCoupon={handleProceedWithoutCoupon}
        onProceedWithCoupon={handleProceedWithCoupon}
        originalAmount={TPA_PRICE}
        testType="tpa"
        validateCoupon={handleValidateCoupon}
      />
    </div>
  );
};

export default TpaPaymentLanding;