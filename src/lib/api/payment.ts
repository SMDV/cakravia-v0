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

  // ===== AI KNOWLEDGE PAYMENT METHODS =====

  // Create payment order for AI Knowledge test
  createAiKnowledgeOrder: async (testId: string): Promise<ApiResponse<PaymentOrder>> => {
    const response = await apiClient.post(`/users/ai_knowledge_tests/${testId}/orders`);
    return response.data;
  },

  // Get payment token for AI Knowledge test
  getAiKnowledgePaymentToken: async (testId: string): Promise<ApiResponse<PaymentToken>> => {
    const response = await apiClient.post(`/users/ai_knowledge_tests/${testId}/orders/payment_token`);
    return response.data;
  },

  // Combined method for AI Knowledge - creates order then gets payment token
  initializeAiKnowledgePayment: async (testId: string): Promise<{ order: PaymentOrder; paymentToken: PaymentToken }> => {
    // First create the order
    const orderResponse = await paymentAPI.createAiKnowledgeOrder(testId);

    // Then get the payment token
    const tokenResponse = await paymentAPI.getAiKnowledgePaymentToken(testId);

    return {
      order: orderResponse.data,
      paymentToken: tokenResponse.data
    };
  },

  // ===== BEHAVIORAL PAYMENT METHODS =====

  // Create payment order for Behavioral test
  createBehavioralOrder: async (testId: string): Promise<ApiResponse<PaymentOrder>> => {
    const response = await apiClient.post(`/users/behavioral_learning_tests/${testId}/orders`);
    return response.data;
  },

  // Get payment token for Behavioral test
  getBehavioralPaymentToken: async (testId: string): Promise<ApiResponse<PaymentToken>> => {
    const response = await apiClient.post(`/users/behavioral_learning_tests/${testId}/orders/payment_token`);
    return response.data;
  },

  // Combined method for Behavioral - creates order then gets payment token
  initializeBehavioralPayment: async (testId: string): Promise<{ order: PaymentOrder; paymentToken: PaymentToken }> => {
    // First create the order
    const orderResponse = await paymentAPI.createBehavioralOrder(testId);

    // Then get the payment token
    const tokenResponse = await paymentAPI.getBehavioralPaymentToken(testId);

    return {
      order: orderResponse.data,
      paymentToken: tokenResponse.data
    };
  },

  // ===== COMPREHENSIVE PAYMENT METHODS =====

  // Create payment order for Comprehensive test
  createComprehensiveOrder: async (testId: string): Promise<ApiResponse<PaymentOrder>> => {
    const response = await apiClient.post(`/users/comprehensive_assessment_tests/${testId}/orders`);
    return response.data;
  },

  // Get payment token for Comprehensive test
  getComprehensivePaymentToken: async (testId: string): Promise<ApiResponse<PaymentToken>> => {
    const response = await apiClient.post(`/users/comprehensive_assessment_tests/${testId}/orders/payment_token`);
    return response.data;
  },

  // Combined method for Comprehensive - creates order then gets payment token
  initializeComprehensivePayment: async (testId: string): Promise<{ order: PaymentOrder; paymentToken: PaymentToken }> => {
    // First create the order
    const orderResponse = await paymentAPI.createComprehensiveOrder(testId);

    // Then get the payment token
    const tokenResponse = await paymentAPI.getComprehensivePaymentToken(testId);

    return {
      order: orderResponse.data,
      paymentToken: tokenResponse.data
    };
  },

  // ===== TPA PAYMENT METHODS =====

  // Create payment order for TPA test
  createTpaOrder: async (testId: string): Promise<ApiResponse<PaymentOrder>> => {
    const response = await apiClient.post(`/users/tpa_tests/${testId}/orders`);
    return response.data;
  },

  // Get payment token for TPA test
  getTpaPaymentToken: async (testId: string): Promise<ApiResponse<PaymentToken>> => {
    const response = await apiClient.post(`/users/tpa_tests/${testId}/orders/payment_token`);
    return response.data;
  },

  // Combined method for TPA - creates order then gets payment token
  initializeTpaPayment: async (testId: string): Promise<{ order: PaymentOrder; paymentToken: PaymentToken }> => {
    // First create the order
    const orderResponse = await paymentAPI.createTpaOrder(testId);

    // Then get the payment token
    const tokenResponse = await paymentAPI.getTpaPaymentToken(testId);

    return {
      order: orderResponse.data,
      paymentToken: tokenResponse.data
    };
  },
};