"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Lock, AlertCircle, User, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { varkAPI, paymentAPI } from '@/lib/api';
import { VarkTest, VarkTestResults, CouponValidationResponse, CouponValidationRequest } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CouponModal } from '@/components/payment';
// import Image from 'next/image';
// import TestChatBg from '@/assets/background/TestChatbg.png';

// Import ApexCharts dynamically for client-side rendering
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })


interface ResultsState {
  isLoading: boolean;
  testData: VarkTest | null;
  resultsData: VarkTestResults | null;
  error: string | null;
  canDownloadCertificate: boolean;
}

// // Type definitions
// interface SmallChartProps {
//   score: number;
//   name: string;
//   color: string;
// }

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

  // Coupon modal state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);


// Payment Success Dialog Component
interface PaymentSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadCertificate: () => void;
}

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

// New Learning Style Section Component
const NewLearningStyleSection = () => {
  if (!resultsState.resultsData) return null;

  const { result_description } = resultsState.resultsData;
  
  // Get dominant learning styles and their data
  const dominantStyles = result_description.learning_styles;
  const dominantScoreData = dominantStyles.map(styleName => {
    // Map style names to our organized scores
    const styleMapping: { [key: string]: string } = {
      'Visual': 'Visual',
      'Aural': 'Auditory', 
      'Auditory': 'Auditory',
      'Read/Write': 'Reading',
      'Kinesthetic': 'Kinesthetic'
    };
    
    const mappedName = styleMapping[styleName] || styleName;
    return organizedScores.find(score => score.name === mappedName);
  }).filter(Boolean); // Remove any undefined values

  // Modified SmallScoreBox Component (without chart, just title and score)
  const SmallScoreBox = ({ score, name, color }: { score: number; name: string; color: string }) => {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
        <div 
          className="text-white text-center py-3 sm:py-4 font-bold text-lg sm:text-xl"
          style={{ backgroundColor: color }}
        >
          {name}
        </div>
        <div className="p-6 sm:p-8 text-center bg-gray-50">
          <div className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: '#24348C' }}>
            {score}
          </div>
          <div className="text-sm sm:text-base text-gray-600">
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
        {/* Blur overlay for locked content - Same as payment wall */}
        {!isPaid && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
            <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl max-w-sm w-full" style={{ borderColor: '#4A47A3' }}>
              <div style={exclusiveBadgeStyle}>EXCLUSIVE</div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                VARK Results + Report Certificate
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                Get your exclusive learning profile with expert-backed strategies tailored just for you!
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

        {/* Magazine-style Header - Adapted for "Your Learning Style" */}
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
              Your Learning Style
            </h2>
            <h3 
              className="text-3xl sm:text-4xl md:text-5xl font-bold italic leading-tight mb-3 sm:mb-4" 
              style={{ 
                color: '#24348C',
                lineHeight: '1.2',
                margin: 0
              }}
            >
              {result_description.title}
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

        {/* 3. Score Cards - Dominant Styles Only (Modified SmallScoreBox) */}
        {dominantScoreData.length > 0 && (
          <div className={`mb-8 sm:mb-12 ${dominantScoreData.length > 1 ? 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6' : 'flex justify-center'}`}>
            {dominantScoreData.map((scoreData, index) => (
              scoreData && (
                <div key={index} className={dominantScoreData.length === 1 ? 'max-w-md w-full' : ''}>
                  <SmallScoreBox 
                    score={scoreData.score} 
                    name={scoreData.name} 
                    color={scoreData.color} 
                  />
                </div>
              )
            ))}
          </div>
        )}

        {/* 4. Ability Description Card - with separator line, same color for title and text */}
        <div className="mb-6 sm:mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#F4F4F4EE' }}>
            <div className="p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#5E5E5E' }}>
                Ability Description
              </h4>
              {/* Separator Line - double weight (2px) */}
              <div className="w-full h-0.5 bg-gray-300 mb-3 sm:mb-4"></div>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#5E5E5E' }}>
                {result_description.characteristics}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Learning Recommendations Card - with separator line */}
        <div className="mb-6 sm:mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#DFE4FF' }}>
            <div className="p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#24348C' }}>
                Learning Recommendations
              </h4>
              {/* Separator Line - double weight (2px) */}
              <div className="w-full h-0.5 mb-3 sm:mb-4" style={{ backgroundColor: '#24348C40' }}></div>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#24348CCC' }}>
                {result_description.study_recommendations}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({ 
  isOpen, 
  onClose, 
  onDownloadCertificate 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Payment Successful!
          </h3>
          <p className="text-green-100 text-sm">
            Your transaction has been completed
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              🎉 Congratulations!
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              You now have access to your complete VARK Learning Style Assessment results and can download your official certificate.
            </p>
          </div>

          {/* Features Unlocked */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h5 className="font-semibold text-blue-800 mb-3 text-sm">
              ✨ Features Now Available:
            </h5>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                Detailed learning style analysis
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                Complete score breakdown
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                Official PDF certificate
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                Personalized recommendations
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onDownloadCertificate}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>📄</span>
              Download Certificate
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
            >
              Continue Reading
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-200"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Add state for dialog in your main component
const [showPaymentSuccessDialog, setShowPaymentSuccessDialog] = useState(false);

// Updated checkPaymentStatus function with dialog instead of alert
const checkPaymentStatus = useCallback(async (testId: string, isAutoCheck = false) => {
  try {
    console.log(`🔍 Checking payment status for test ${testId}${isAutoCheck ? ' (auto-check)' : ''}`);
    
    // Get auth token from cookie
    const authToken = document.cookie.split('auth_token=')[1]?.split(';')[0];
    if (!authToken) {
      console.warn('⚠️ No auth token found for payment check');
      return false;
    }

    // Call the single order API endpoint
    const orderResponse = await fetch(`https://api.cakravia.com/api/v1/users/vark_tests/${testId}/orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (orderResponse.ok) {
      const orderData = await orderResponse.json();
      const order = orderData.data;
      
      console.log('📊 Order data received:', order);
      
      // Check if payment is completed based on order status
      const hasValidPayment = order.status === 'paid' && order.can_download_certificate === true;
      
      if (hasValidPayment) {
        console.log('✅ Payment verified as completed');
        setIsPaid(true);
        setResultsState(prev => ({ ...prev, canDownloadCertificate: true }));
        
        // Show success dialog if this was an auto-check after payment
        if (isAutoCheck) {
          setShowPaymentSuccessDialog(true);
        }
      } else {
        console.log('❌ Payment not completed yet. Status:', order.status);
        setIsPaid(false);
        setResultsState(prev => ({ ...prev, canDownloadCertificate: false }));
        
        // If this was an auto-check and payment is still pending, inform user
        if (isAutoCheck && order.status === 'pending') {
          console.log('⏳ Payment is still pending...');
          // Optionally show a message that payment is being processed
        }
      }
      
      return hasValidPayment;
    } else {
      console.warn('⚠️ Failed to fetch order data:', orderResponse.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Payment status check failed:', error);
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

// Enhanced openSnapPopup function with automatic status check
const openSnapPopup = useCallback((snapToken: string) => {
  const urlParams = new URLSearchParams(window.location.search);
  const testId = urlParams.get('testId');
  
  if (window.snap) {
    window.snap.pay(snapToken, {
      onSuccess: function(result: MidtransResult) {
        console.log('💳 Payment successful:', result);
        
        // Automatically check payment status after successful payment
        if (testId) {
          setTimeout(() => {
            console.log('🔄 Auto-checking payment status after success...');
            checkPaymentStatus(testId, true);
          }, 3000); // Wait 3 seconds for payment to be processed on server
        }
      },
      onPending: function(result: MidtransResult) {
        console.log('⏳ Payment pending:', result);
        
        // Also check status for pending payments (some payment methods complete quickly)
        if (testId) {
          setTimeout(() => {
            console.log('🔄 Auto-checking payment status after pending...');
            checkPaymentStatus(testId, true);
          }, 5000); // Wait 5 seconds for pending payments
        }
      },
      onError: function(result: MidtransResult) {
        console.error('❌ Payment failed:', result);
        alert('Payment failed. Please try again or contact support if the issue persists.');
      },
      onClose: function() {
        console.log('🔒 Payment popup closed by user');
        
        // Check payment status when popup is closed (user might have completed payment)
        if (testId) {
          setTimeout(() => {
            console.log('🔄 Auto-checking payment status after popup close...');
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
          console.log('🔄 Polling payment status...');
          checkPaymentStatus(testId, true).then((isPaid) => {
            if (isPaid) {
              clearInterval(pollInterval);
              console.log('✅ Payment detected via polling');
            }
          });
        }, 10000); // Check every 10 seconds
        
        // Stop polling after 10 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          console.log('⏰ Stopped polling for payment after 10 minutes');
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
        const paymentResult = await paymentAPI.initializeVarkPayment(testId, couponCode);

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
            const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/vark_tests/${testId}/orders/payment_token`, {
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

  // Enhanced certificate purchase handler with existing order check
  const handlePurchaseCertificate = () => {
    // Simply open the coupon modal instead of proceeding directly to payment
    handleOpenCouponModal();
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
  // const sortedScores = [...organizedScores].sort((a, b) => b.score - a.score);
  // const highestScore = sortedScores[0];
  // const otherScores = sortedScores.slice(1);

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
      height: 350,
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
          fontSize: "14px",
          formatter: (seriesName: string, opts: { w: { globals: { series: number[] } }; seriesIndex: number }) => 
            seriesName + ":  " + opts.w.globals.series[opts.seriesIndex] + "%",
        },
      },
    },
    colors: ["#8979FF", "#FF928A", "#3CC3DF", "#FFAE4C"], // Updated color scheme
    labels: ["Visual", "Auditory", "Reading", "Kinesthetic"],
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          plotOptions: {
            radialBar: {
              barLabels: {
                fontSize: "12px",
              },
            },
          },
        },
      },
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 250,
          },
          plotOptions: {
            radialBar: {
              barLabels: {
                fontSize: "10px",
              },
            },
          },
        },
      },
    ],
    legend: {
      show: false,
    },
  };

  // Individual scores component - Updated to use ApexCharts for single values
  // const SmallChart: React.FC<SmallChartProps> = ({ score, name, color }) => {
  //   const percentage = organizedScores.find(item => item.name === name)?.percentage || 0;
    
  //   const singleChartOptions = {
  //     chart: {
  //       height: 180,
  //       type: "radialBar" as const,
  //       toolbar: {
  //         show: false,
  //       },
  //     },
  //     plotOptions: {
  //       radialBar: {
  //         startAngle: -90,
  //         endAngle: 90,
  //         hollow: {
  //           margin: 5,
  //           size: "50%",
  //           background: "transparent",
  //         },
  //         track: {
  //           background: '#E5E7EB', // Grey color for unfilled portions
  //           strokeWidth: '100%',
  //           margin: 5,
  //         },
  //         dataLabels: {
  //           name: {
  //             show: false,
  //           },
  //           value: {
  //             show: true,
  //             fontSize: "20px",
  //             fontWeight: "bold",
  //             color: "#2A3262",
  //             formatter: () => `${percentage.toFixed(1)}%`,
  //           },
  //         },
  //       },
  //     },
  //     colors: [color],
  //     labels: [name],
  //     stroke: {
  //       lineCap: "round" as const,
  //     },
  //     responsive: [
  //       {
  //         breakpoint: 768,
  //         options: {
  //           chart: {
  //             height: 160,
  //           },
  //           plotOptions: {
  //             radialBar: {
  //               dataLabels: {
  //                 value: {
  //                   fontSize: "18px",
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //       {
  //         breakpoint: 480,
  //         options: {
  //           chart: {
  //             height: 140,
  //           },
  //           plotOptions: {
  //             radialBar: {
  //               dataLabels: {
  //                 value: {
  //                   fontSize: "16px",
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     ],
  //   };
    
  //   return (
  //     <div className="rounded-xl overflow-hidden shadow-lg">
  //       <div 
  //         className="text-white text-center py-2 sm:py-3 font-bold text-sm sm:text-lg"
  //         style={{ backgroundColor: '#8BC34A' }}
  //       >
  //         {name} Score: {score}
  //       </div>
  //       <div className="p-3 sm:p-6 bg-gray-50">
  //         <ApexCharts
  //           options={singleChartOptions}
  //           series={[percentage]}
  //           type="radialBar"
  //           height={180}
  //         />
  //       </div>
  //     </div>
  //   );
  // };

  // Loading state
  if (resultsState.isLoading) {
    return (
      <div className="min-h-screen bg-[#E0E6F6] flex items-center justify-center">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading your results...</p>
        </div>
      </div>
    );
  }

  // Don't render if no results data
  if (!resultsState.resultsData) {
    return (
      <div className="min-h-screen bg-[#E0E6F6] flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-yellow-700">No Results Available</h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
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
            className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base"
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
        <div className="w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-purple-400 to-orange-400 rounded-full blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-full h-auto opacity-50 z-0 pointer-events-none">
        <div className="w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-green-400 to-blue-400 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 py-6 sm:py-12 md:py-24 lg:py-32 z-10 relative">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          {/* User Welcome Section */}
          {user && (
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">Welcome back, {user.name}!</h2>
                  <p className="text-gray-600 text-sm sm:text-base">Here are your VARK Learning Style Assessment results</p>
                </div>
              </div>
            </div>
          )}

          {/* Top Section: Final Report */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#4A47A3' }}>
                Here is your final report
              </h1>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm" style={{ color: '#4A47A3' }}>Certificate ID: 124095102958</p>
                {resultsState.testData && (
                  <p className="text-xs text-gray-500">Test ID: {resultsState.testData.id.slice(0, 8)}...</p>
                )}
              </div>
            </div>

            {/* Main content: Responsive Layout */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
              {/* Chart Section */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <Card className="rounded-lg overflow-hidden border-none shadow-lg w-full">
                  <CardHeader className="bg-[#8BC34A] text-white rounded-t-lg py-3 sm:py-4">
                    <CardTitle className="text-center text-lg sm:text-2xl font-bold" style={{ color: '#24348C' }}>Total Learning Percentage</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 bg-[#F0F2F5]">
                    {/* ApexCharts component */}
                    <ApexCharts
                      options={learningChartOptions}
                      series={learningChartSeries}
                      type="radialBar"
                      height={350}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Descriptions Section */}
              <div className="w-full lg:w-1/2 space-y-4 sm:space-y-6">
                {/* VARK Descriptions */}
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" style={{ color: '#8BC34A' }} />
                  <div>
                    <h3 className="font-bold mb-2 text-sm sm:text-base" style={{ color: '#2A3262' }}>Visual (Score: {scoresData.visual})</h3>
                    <p className="text-xs sm:text-sm text-gray-700">
                      Learning by looking at pictures, graphs, videos, and graphics. Could not take complete note during presentation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" style={{ color: '#8BC34A' }} />
                  <div>
                    <h3 className="font-bold mb-2 text-sm sm:text-base" style={{ color: '#2A3262' }}>Auditory (Score: {scoresData.auditory})</h3>
                    <p className="text-xs sm:text-sm text-gray-700">
                      Receive learning by listening method, by speaking or from music, discussion, and explanation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" style={{ color: '#8BC34A' }} />
                  <div>
                    <h3 className="font-bold mb-2 text-sm sm:text-base" style={{ color: '#2A3262' }}>Reading (Score: {scoresData.reading})</h3>
                    <p className="text-xs sm:text-sm text-gray-700">
                      Prefer words and texts as an information obtaining method. They like presentation style, by text or writing
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" style={{ color: '#8BC34A' }} />
                  <div>
                    <h3 className="font-bold mb-2 text-sm sm:text-base" style={{ color: '#2A3262' }}>Kinesthetic (Score: {scoresData.kinesthetic})</h3>
                    <p className="text-xs sm:text-sm text-gray-700">
                      More likely to experience through physical movement aspect while studying, such as, touch, feel, hold, perform, and move something. They prefer hands on work, practical, project, and real experience
                    </p>
                  </div>
                </div>

                {/* Payment/Download Component - Same as payment wall */}
                <div className="mt-6 sm:mt-8">
                  {isPaid ? (
                    <button 
                      className="w-full py-2 sm:py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
                      style={{ backgroundColor: '#4A47A3' }}
                      onClick={handleDownloadCertificate}
                    >
                      Download PDF Certificate
                    </button>
                  ) : (
                    <div className="bg-white p-4 sm:p-6 text-center border-2 shadow-md rounded-xl w-full" style={{ borderColor: '#4A47A3' }}>
                      <div style={exclusiveBadgeStyle}>EXCLUSIVE</div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                        VARK Results + Report Certificate
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                        Get your exclusive learning profile with expert-backed strategies tailored just for you
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

          {/* NEW SECTION: Replace the old Learning Style Details Section */}
          <NewLearningStyleSection />

          {/* Test Again Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-12 mb-6 sm:mb-12">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#4A47A3' }}>
                Want to retake the assessment?
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Learning styles can evolve over time. Take the test again to see if your preferences have changed.
              </p>
              <Link
                href="/test"
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
        testType="vark"
        validateCoupon={handleValidateCoupon}
      />
    </div>
  );
};

export default EnhancedResultsDashboard;