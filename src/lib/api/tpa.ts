import { apiClient } from './client';
import { ApiResponse, TpaQuestionSet, TpaTest, TpaSubmission, TpaTestResults } from '../types';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export const tpaAPI = {
  // Get active question set
  getActiveQuestionSet: async (): Promise<ApiResponse<TpaQuestionSet>> => {
    try {
      console.log('🔄 Fetching TPA active question set...');
      const response = await apiClient.get('/users/tpa_tests/active_question_set');
      console.log('✅ TPA active question set response:', response.data);
      return response.data; // API returns { data: questionSet, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to fetch TPA active question set:', error);
      throw error;
    }
  },

  // Create TPA order (payment-first flow)
  createOrder: async (couponCode?: string): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      console.log('🔄 Creating TPA order...', couponCode ? `with coupon: ${couponCode}` : 'without coupon');
      const payload = couponCode ? { coupon_code: couponCode } : {};
      const response = await apiClient.post('/users/tpa_tests/order', payload);
      console.log('✅ TPA order creation response:', response.data);
      return response.data; // API returns { data: order, status: "created", error: false }
    } catch (error) {
      console.error('❌ Failed to create TPA order:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to create TPA order. Please try again.');
      }
    }
  },

  // Create new TPA test (requires paid order_id)
  createTest: async (questionSetId: string, orderId: string): Promise<ApiResponse<TpaTest>> => {
    try {
      console.log('🔄 Creating TPA test with question set ID:', questionSetId, 'and order ID:', orderId);
      const response = await apiClient.post('/users/tpa_tests', {
        tpa_question_set_id: questionSetId,
        order_id: orderId
      });
      console.log('✅ TPA test creation response:', response.data);
      return response.data; // API returns { data: test, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to create TPA test:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to create TPA test. Please try again.');
      }
    }
  },

  // Get specific test (for history)
  getTest: async (testId: string): Promise<ApiResponse<TpaTest>> => {
    try {
      console.log('🔄 Fetching TPA test:', testId);
      const response = await apiClient.get(`/users/tpa_tests/${testId}`);
      console.log('✅ TPA test response:', response.data);
      return response.data; // API returns { data: test, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to fetch TPA test:', error);
      throw error;
    }
  },

  // Submit test answers
  submitAnswers: async (testId: string, submission: TpaSubmission): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      console.log('🔄 Submitting TPA answers for test:', testId);
      console.log('📝 TPA submission data:', submission);

      const response = await apiClient.post(`/users/tpa_tests/${testId}/submit_answers`, submission);
      console.log('✅ Submit TPA answers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to submit TPA answers:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to submit TPA answers. Please try again.');
      }
    }
  },

  // Get TPA test results
  getTestResults: async (testId: string): Promise<ApiResponse<TpaTestResults>> => {
    try {
      console.log('🔄 Fetching TPA test results for:', testId);
      const response = await apiClient.get(`/users/tpa_tests/${testId}/results`);
      console.log('✅ TPA test results response:', response.data);

      // The API might return string values that need to be converted to numbers
      // Following the same pattern as other test APIs
      const rawData = response.data.data;

      // Convert string values to numbers for consistent data handling if needed
      const convertedData: TpaTestResults = {
        ...rawData,
        // Convert TPA category scores (4 reasoning dimensions)
        analytical_reasoning_score: typeof rawData.analytical_reasoning_score === 'string' ? parseFloat(rawData.analytical_reasoning_score) : rawData.analytical_reasoning_score,
        quantitative_reasoning_score: typeof rawData.quantitative_reasoning_score === 'string' ? parseFloat(rawData.quantitative_reasoning_score) : rawData.quantitative_reasoning_score,
        spatial_reasoning_score: typeof rawData.spatial_reasoning_score === 'string' ? parseFloat(rawData.spatial_reasoning_score) : rawData.spatial_reasoning_score,
        verbal_reasoning_score: typeof rawData.verbal_reasoning_score === 'string' ? parseFloat(rawData.verbal_reasoning_score) : rawData.verbal_reasoning_score,
        total_score: typeof rawData.total_score === 'string' ? parseFloat(rawData.total_score) : rawData.total_score,
        average_score: typeof rawData.average_score === 'string' ? parseFloat(rawData.average_score) : rawData.average_score,
        min_score: typeof rawData.min_score === 'string' ? parseFloat(rawData.min_score) : rawData.min_score,
        max_score: typeof rawData.max_score === 'string' ? parseFloat(rawData.max_score) : rawData.max_score,
        scores_breakdown: rawData.scores_breakdown?.map((item: { score: string | number; percentage: string | number; [key: string]: unknown }) => ({
          ...item,
          score: typeof item.score === 'string' ? parseFloat(item.score) : item.score,
          percentage: typeof item.percentage === 'string' ? parseFloat(item.percentage) : item.percentage
        })) || [],
        // Keep other fields as they are
        dominant_reasoning_categories: rawData.dominant_reasoning_categories || [],
        category_interpretations: rawData.category_interpretations || {},
        result_description: rawData.result_description || {
          title: '',
          description: '',
          recommendations: '',
          reasoning_profile: ''
        }
      };

      return {
        ...response.data,
        data: convertedData
      };
    } catch (error) {
      console.error('❌ Failed to fetch TPA test results:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to fetch TPA test results. Please try again.');
      }
    }
  },

  // Payment-first flow: Create order and get payment token
  startPaymentFlow: async (couponCode?: string): Promise<{ order: Record<string, unknown>; questionSet: TpaQuestionSet }> => {
    try {
      console.log('🚀 Starting TPA payment flow...', couponCode ? `with coupon: ${couponCode}` : '');

      // 1. Get active question set
      const questionSetResponse = await tpaAPI.getActiveQuestionSet();
      const questionSet = questionSetResponse.data;

      // 2. Create order (with optional coupon)
      const orderResponse = await tpaAPI.createOrder(couponCode);
      const order = orderResponse.data;

      console.log('✅ TPA payment flow started successfully');
      return { order, questionSet };
    } catch (error) {
      console.error('❌ Failed to start TPA payment flow:', error);
      throw error;
    }
  },

  // Test creation flow (after payment is completed)
  startTestFlow: async (orderId: string): Promise<{ questionSet: TpaQuestionSet; test: TpaTest }> => {
    try {
      console.log('🚀 Starting TPA test flow with paid order:', orderId);

      // 1. Validate order payment status using standalone order endpoint
      const { paymentAPI } = await import('./payment');
      const isOrderReady = await paymentAPI.isOrderPaidAndReady(orderId);

      if (!isOrderReady) {
        throw new Error('Order payment has not been completed. Please complete payment first.');
      }

      // 2. Get active question set
      const questionSetResponse = await tpaAPI.getActiveQuestionSet();
      const questionSet = questionSetResponse.data;

      // 3. Create test with the paid order ID
      const testResponse = await tpaAPI.createTest(questionSet.id, orderId);
      const test = testResponse.data;

      console.log('✅ TPA test flow started successfully');
      return { questionSet, test };
    } catch (error) {
      console.error('❌ Failed to start TPA test flow:', error);
      throw error;
    }
  },

  // Helper method to validate order payment status before test creation (deprecated - use paymentAPI.isOrderPaidAndReady)
  validateOrderPayment: (order: Record<string, unknown>): boolean => {
    const orderData = order as { status?: string; payment?: { status?: string } };
    return orderData.status === 'paid' || orderData.payment?.status === 'settlement';
  },

  // Get order details for TPA test (uses standalone order endpoint)
  getOrderDetails: async (orderId: string): Promise<unknown> => {
    try {
      console.log('🔄 Fetching TPA order details:', orderId);
      const { paymentAPI } = await import('./payment');
      const response = await paymentAPI.getStandaloneOrder(orderId);
      console.log('✅ TPA order details:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch TPA order details:', error);
      throw error;
    }
  },

  // Download TPA certificate (payment was done upfront)
  downloadCertificate: async (testId: string): Promise<Blob> => {
    try {
      console.log('🔄 Downloading TPA certificate for test:', testId);
      const response = await apiClient.get(`/users/tpa_tests/${testId}/orders/download_certificate`, {
        responseType: 'blob'
      });
      console.log('✅ TPA certificate downloaded successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to download TPA certificate:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to download certificate. Please ensure payment is completed.');
      }
    }
  }
};