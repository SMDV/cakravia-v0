'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CouponValidationResponse, CouponValidationRequest } from '@/lib/types';
import { Tag, X, Loader2, CheckCircle, XCircle, Gift, ArrowRight } from 'lucide-react';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedWithoutCoupon: () => void;
  onProceedWithCoupon: (couponData: CouponValidationResponse) => void;
  originalAmount: number;
  testType: 'vark' | 'ai_knowledge' | 'behavioral' | 'comprehensive' | 'tpa';
  validateCoupon?: (request: CouponValidationRequest) => Promise<CouponValidationResponse>;
}

export const CouponModal: React.FC<CouponModalProps> = ({
  isOpen,
  onClose,
  onProceedWithoutCoupon,
  onProceedWithCoupon,
  originalAmount,
  testType,
  validateCoupon
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const getTestDisplayName = () => {
    const names = {
      vark: 'VARK Learning Style',
      ai_knowledge: 'AI Knowledge',
      behavioral: 'Behavioral Learning',
      comprehensive: 'Comprehensive Assessment',
      tpa: 'TPA Assessment'
    };
    return names[testType];
  };

  // Mock validation function for demo purposes
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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      const request: CouponValidationRequest = {
        coupon_code: couponCode.trim().toUpperCase(),
        amount: originalAmount.toString()
      };

      const result = validateCoupon ? await validateCoupon(request) : await mockValidateCoupon(request);

      if (result.valid) {
        setAppliedCoupon(result);
        setValidationError(null);
      } else {
        setValidationError(result.message);
      }
    } catch (error) {
      void error; // Suppress unused variable warning
      setValidationError('Failed to validate coupon. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleProceedWithCoupon = () => {
    if (appliedCoupon) {
      onProceedWithCoupon(appliedCoupon);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating) {
      if (appliedCoupon) {
        handleProceedWithCoupon();
      } else {
        handleApplyCoupon();
      }
    }
  };

  const getFinalAmount = () => {
    if (appliedCoupon) {
      return parseFloat(appliedCoupon.pricing.final_amount);
    }
    return originalAmount;
  };

  const getSavings = () => {
    if (appliedCoupon) {
      return parseFloat(appliedCoupon.pricing.discount_amount);
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900">
              {appliedCoupon ? 'Coupon Applied!' : 'Save Money!'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {appliedCoupon ? (
            // Coupon Applied State
            <div className="space-y-4">
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-800">{appliedCoupon.coupon.code}</span>
                      <span className="text-sm text-green-600">
                        ({appliedCoupon.coupon.display_discount} off)
                      </span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      {appliedCoupon.message}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Pricing Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{getTestDisplayName()} Certificate</span>
                  <span className="line-through text-gray-500">{formatCurrency(originalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({appliedCoupon.coupon.code})</span>
                  <span>-{formatCurrency(getSavings())}</span>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Final Price</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(getFinalAmount())}</span>
                  </div>
                  <p className="text-sm text-green-600 text-right">
                    You save {formatCurrency(getSavings())}!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleProceedWithCoupon} className="flex-1">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continue to Payment
                </Button>
              </div>
            </div>
          ) : (
            // Coupon Input State
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  Have a coupon code for your <strong>{getTestDisplayName()}</strong> certificate?
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  Current Price: {formatCurrency(originalAmount)}
                </p>
              </div>

              {/* Coupon Input */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter coupon code"
                      disabled={isValidating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                    />
                  </div>
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || isValidating}
                    className="whitespace-nowrap"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Tag className="w-4 h-4 mr-2" />
                        Apply
                      </>
                    )}
                  </Button>
                </div>

                {/* Error Message */}
                {validationError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Demo Helper */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium mb-1">Try these demo codes:</p>
                  <div className="flex flex-wrap gap-1">
                    {['SAVE30', 'WELCOME20', 'FIXED5000'].map(code => (
                      <button
                        key={code}
                        onClick={() => setCouponCode(code)}
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onProceedWithoutCoupon} className="flex-1">
                  Skip & Pay {formatCurrency(originalAmount)}
                </Button>
                <Button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || isValidating}
                  className="flex-1"
                >
                  Apply Coupon
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponModal;