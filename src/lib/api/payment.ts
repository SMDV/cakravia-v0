import { apiClient } from './client';
import { ApiResponse, PaymentOrder, PaymentToken } from '../types';

export const paymentAPI = {
  // Create payment order for VARK test
  createVarkOrder: async (testId: string): Promise<ApiResponse<PaymentOrder>> => {
    const response = await apiClient.post(`/users/vark_tests/${testId}/orders`);
    return response.data;
  },

  // Get payment token for VARK test
  getVarkPaymentToken: async (testId: string): Promise<ApiResponse<PaymentToken>> => {
    const response = await apiClient.post(`/users/vark_tests/${testId}/orders/payment_token`);
    return response.data;
  },

  // Combined method for easier use - creates order then gets payment token
  initializeVarkPayment: async (testId: string): Promise<{ order: PaymentOrder; paymentToken: PaymentToken }> => {
    // First create the order
    const orderResponse = await paymentAPI.createVarkOrder(testId);
    
    // Then get the payment token
    const tokenResponse = await paymentAPI.getVarkPaymentToken(testId);
    
    return {
      order: orderResponse.data,
      paymentToken: tokenResponse.data
    };
  },
};