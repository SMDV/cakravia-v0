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

  // Create new TPA test
  createTest: async (questionSetId: string): Promise<ApiResponse<TpaTest>> => {
    try {
      console.log('🔄 Creating TPA test with question set ID:', questionSetId);
      const response = await apiClient.post('/users/tpa_tests', {
        tpa_question_set_id: questionSetId
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

  // Helper method to start a complete test flow
  startTestFlow: async (): Promise<{ questionSet: TpaQuestionSet; test: TpaTest }> => {
    try {
      console.log('🚀 Starting complete TPA test flow...');

      // 1. Get active question set
      const questionSetResponse = await tpaAPI.getActiveQuestionSet();
      const questionSet = questionSetResponse.data;

      // 2. Create test with the question set
      const testResponse = await tpaAPI.createTest(questionSet.id);
      const test = testResponse.data;

      console.log('✅ TPA test flow started successfully');
      return { questionSet, test };
    } catch (error) {
      console.error('❌ Failed to start TPA test flow:', error);
      throw error;
    }
  }
};