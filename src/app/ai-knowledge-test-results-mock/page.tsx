"use client"

import React, { useState } from 'react';
import { Check, Lock, AlertCircle, User, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from 'next/link';
import { AiKnowledgeTestResults as AiKnowledgeTestResultsType, CouponValidationRequest, CouponValidationResponse } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CouponModal } from '@/components/payment';

// Import ApexCharts dynamically for client-side rendering
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false })


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

// Mock results data that matches the real API response structure
const mockResultsData: AiKnowledgeTestResultsType = {
  pe_score: 4.2,
  ee_score: 3.8,
  si_score: 3.1,
  fc_score: 3.9,
  hm_score: 4.5,
  pv_score: 3.6,
  ht_score: 2.8,
  bi_score: 4.3,
  min_score: 1.0,
  max_score: 5.0,
  total_score: 30.2,
  scores_breakdown: [
    { category: 'Performance Expectancy', code: 'PE', score: 4.2, percentage: 84 },
    { category: 'Effort Expectancy', code: 'EE', score: 3.8, percentage: 76 },
    { category: 'Social Influence', code: 'SI', score: 3.1, percentage: 62 },
    { category: 'Facilitating Conditions', code: 'FC', score: 3.9, percentage: 78 },
    { category: 'Hedonic Motivation', code: 'HM', score: 4.5, percentage: 90 },
    { category: 'Price Value', code: 'PV', score: 3.6, percentage: 72 },
    { category: 'Habit', code: 'HT', score: 2.8, percentage: 56 },
    { category: 'Behavioral Intention', code: 'BI', score: 4.3, percentage: 86 }
  ],
  dominant_categories: ['HM', 'BI', 'PE'],
  category_interpretations: {
    PE: 'You strongly believe AI tools can significantly improve your academic performance and learning outcomes.',
    EE: 'You find AI tools moderately easy to use and integrate into your learning workflow.',
    SI: 'Social factors have a moderate influence on your decision to use AI for learning.',
    FC: 'Your environment provides good support for using AI tools in your learning activities.',
    HM: 'You derive high enjoyment and satisfaction from using AI tools for learning purposes.',
    PV: 'You see moderate value in the cost-benefit ratio of using AI tools for education.',
    HT: 'AI usage has not yet become a strong habit in your learning routine.',
    BI: 'You have a strong intention to continue using AI tools for learning in the future.'
  },
  result_description: {
    ai_readiness_level: 'High AI Readiness',
    title: 'AI-Enthusiastic Learner',
    description: 'You demonstrate a strong positive attitude toward AI integration in learning. Your high scores in Performance Expectancy, Hedonic Motivation, and Behavioral Intention indicate that you see significant value in AI tools and genuinely enjoy using them for educational purposes. You believe AI can enhance your academic performance and you have a strong commitment to continue using these tools.',
    recommendations: 'Continue exploring advanced AI tools and consider becoming an AI learning advocate in your academic community. Focus on developing consistent habits around AI usage to maximize the benefits. Consider sharing your positive experiences with peers to help build a supportive AI learning community.'
  }
};

// Mock user data for display
const mockUser = {
  id: 'mock-user-id',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  updated_at: new Date().toISOString()
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

// New AI Knowledge Style Section Component (adapted from VARK)
const NewAIKnowledgeStyleSection = ({ isPaid, handlePurchaseCertificate, isProcessingPayment, organizedScores }: {
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
}) => {
  const { result_description } = mockResultsData;


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
            {score.toFixed(1)}
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
                AI Knowledge Results + Certificate
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                Get your exclusive AI readiness profile with expert-backed strategies tailored just for you!
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
              {result_description?.title}
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
                {result_description?.description}
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
                {result_description?.recommendations}
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
              You now have access to your complete AI Knowledge Assessment results and can download your official certificate.
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
                Detailed AI readiness analysis
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
                Personalized AI recommendations
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

const EnhancedAIKnowledgeResultsDashboard = () => {

  // Mock payment state
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentSuccessDialog, setShowPaymentSuccessDialog] = useState(false);

  // Coupon modal state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);

  // Suppress unused variable warning - appliedCoupon used for future functionality
  void appliedCoupon;

  // Mock coupon validation function
  const mockValidateCoupon = async (request: CouponValidationRequest): Promise<CouponValidationResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const originalAmount = parseFloat(request.amount);
    const mockCoupons = {
      'SAVE30': {
        valid: true,
        message: 'Coupon applied successfully',
        coupon: {
          code: 'SAVE30',
          discount_type: 'percentage' as const,
          display_discount: '30%'
        },
        pricing: {
          original_amount: originalAmount,
          discount_amount: (originalAmount * 0.3).toString(),
          final_amount: (originalAmount * 0.7).toString()
        }
      },
      'WELCOME20': {
        valid: true,
        message: 'Welcome discount applied',
        coupon: {
          code: 'WELCOME20',
          discount_type: 'percentage' as const,
          display_discount: '20%'
        },
        pricing: {
          original_amount: originalAmount,
          discount_amount: (originalAmount * 0.2).toString(),
          final_amount: (originalAmount * 0.8).toString()
        }
      },
      'FIXED5000': {
        valid: true,
        message: 'Fixed discount applied',
        coupon: {
          code: 'FIXED5000',
          discount_type: 'fixed' as const,
          display_discount: 'Rp 5.000'
        },
        pricing: {
          original_amount: originalAmount,
          discount_amount: '5000',
          final_amount: (originalAmount - 5000).toString()
        }
      }
    };

    const coupon = mockCoupons[request.coupon_code as keyof typeof mockCoupons];
    if (coupon) {
      return coupon;
    } else {
      return {
        valid: false,
        message: 'Invalid coupon code. Please check and try again.',
        coupon: {
          code: request.coupon_code,
          discount_type: 'percentage',
          display_discount: '0%'
        },
        pricing: {
          original_amount: originalAmount,
          discount_amount: '0',
          final_amount: originalAmount.toString()
        }
      };
    }
  };

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
    proceedToPayment();
  };

  // Actual payment processing function
  const proceedToPayment = () => {
    setIsProcessingPayment(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsPaid(true);
      setShowPaymentSuccessDialog(true);
    }, 2000);
  };

  // Mock handlers
  const handlePurchaseCertificate = () => {
    // Open coupon modal instead of proceeding directly to payment
    handleOpenCouponModal();
  };

  const handleDownloadCertificate = async () => {
    alert('Certificate download would start here (mock implementation)');
  };

  // Create organized data for AI knowledge categories
  const organizedScores = Object.entries(AI_KNOWLEDGE_CATEGORIES).map(([code, info]) => {
    const score = (() => {
      switch (code) {
        case 'PE': return mockResultsData.pe_score;
        case 'EE': return mockResultsData.ee_score;
        case 'SI': return mockResultsData.si_score;
        case 'FC': return mockResultsData.fc_score;
        case 'HM': return mockResultsData.hm_score;
        case 'PV': return mockResultsData.pv_score;
        case 'HT': return mockResultsData.ht_score;
        case 'BI': return mockResultsData.bi_score;
        default: return 0;
      }
    })();

    const percentage = (score / mockResultsData.max_score) * 100;

    return {
      name: info.name,
      score,
      percentage,
      color: info.color,
      code
    };
  });

  // Data for ApexCharts Radar Chart (AI Knowledge Categories)
  const aiKnowledgeChartSeries = [{
    name: 'AI Knowledge Scores',
    data: organizedScores.map(item => item.score)
  }];

  const aiKnowledgeChartOptions = {
    chart: {
      height: 350,
      type: "radar" as const,
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
      max: mockResultsData.max_score,
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
  };


  return (
    <div className="min-h-screen bg-[#E0E6F6] relative overflow-hidden" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <Header currentPage="ai-knowledge-test-results" />

      {/* Mock Banner */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 relative z-10">
        <div className="flex max-w-6xl mx-auto">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Mock UI Mode:</strong> This is a preview using the VARK results layout adapted for AI Knowledge assessment with spider charts and mock data.
            </p>
          </div>
        </div>
      </div>

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
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Welcome back, {mockUser.name}!</h2>
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
                <p className="text-xs sm:text-sm" style={{ color: '#4A47A3' }}>Certificate ID: AI-124095102958</p>
                <p className="text-xs text-gray-500">Test ID: mock-test-id</p>
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
                    <ApexCharts
                      options={aiKnowledgeChartOptions}
                      series={aiKnowledgeChartSeries}
                      type="radar"
                      height={350}
                    />
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
                      <div style={exclusiveBadgeStyle}>EXCLUSIVE</div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
                        AI Knowledge Results + Certificate
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                        Get your exclusive AI readiness profile with expert-backed strategies
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
            isPaid={isPaid}
            handlePurchaseCertificate={handlePurchaseCertificate}
            isProcessingPayment={isProcessingPayment}
            organizedScores={organizedScores}
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
        validateCoupon={mockValidateCoupon}
      />

    </div>
  );
};

export default EnhancedAIKnowledgeResultsDashboard;