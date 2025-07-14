import { apiClient } from './client';
import { ApiResponse, VarkQuestionSet, VarkTest, VarkSubmission, VarkTestResults, VarkLearningStyleInterpretation, VarkResultDescription } from '../types';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export const varkAPI = {
  // Get active question set
  getActiveQuestionSet: async (): Promise<ApiResponse<VarkQuestionSet>> => {
    try {
      console.log('🔄 Fetching active question set...');
      const response = await apiClient.get('/users/vark_tests/active_question_set');
      console.log('✅ Active question set response:', response.data);
      return response.data; // API returns { data: questionSet, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to fetch active question set:', error);
      throw error;
    }
  },

  // Create new VARK test
  createTest: async (questionSetId: string): Promise<ApiResponse<VarkTest>> => {
    try {
      console.log('🔄 Creating VARK test with question set ID:', questionSetId);
      const response = await apiClient.post('/users/vark_tests', {
        vark_question_set_id: questionSetId
      });
      console.log('✅ Test creation response:', response.data);
      return response.data; // API returns { data: test, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to create test:', error);
      
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to create test. Please try again.');
      }
    }
  },

  // Get specific test (for history)
  getTest: async (testId: string): Promise<ApiResponse<VarkTest>> => {
    try {
      console.log('🔄 Fetching test:', testId);
      const response = await apiClient.get(`/users/vark_tests/${testId}`);
      console.log('✅ Test response:', response.data);
      return response.data; // API returns { data: test, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to fetch test:', error);
      throw error;
    }
  },

  // Submit test answers
  submitAnswers: async (testId: string, submission: VarkSubmission): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      console.log('🔄 Submitting answers for test:', testId);
      console.log('📝 Submission data:', submission);
      
      const response = await apiClient.post(`/users/vark_tests/${testId}/submit_answers`, submission);
      console.log('✅ Submit answers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to submit answers:', error);
      
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to submit answers. Please try again.');
      }
    }
  },

  // Get VARK test results
  getTestResults: async (testId: string): Promise<ApiResponse<VarkTestResults>> => {
    try {
      console.log('🔄 Fetching test results for:', testId);
      const response = await apiClient.get(`/users/vark_tests/${testId}/results`);
      console.log('✅ Test results response:', response.data);
      
      // Define the raw API response type (with string values)
      interface RawVarkTestResults {
        visual_score: string;
        aural_score: string;
        read_score: string;
        kinesthetic_score: string;
        min_score: string;
        max_score: string;
        total_score: string;
        scores_breakdown: Array<{
          category: string;
          code: string;
          score: string;
          percentage: string;
        }>;
        dominant_learning_styles: string[];
        learning_style_interpretation: VarkLearningStyleInterpretation;
        result_description: VarkResultDescription;
      }
      
      // Convert string values to numbers for consistent data handling
      const rawData: RawVarkTestResults = response.data.data;
      const convertedData: VarkTestResults = {
        ...rawData,
        visual_score: parseFloat(rawData.visual_score),
        aural_score: parseFloat(rawData.aural_score),
        read_score: parseFloat(rawData.read_score),
        kinesthetic_score: parseFloat(rawData.kinesthetic_score),
        min_score: parseFloat(rawData.min_score),
        max_score: parseFloat(rawData.max_score),
        total_score: parseFloat(rawData.total_score),
        scores_breakdown: rawData.scores_breakdown.map((item) => ({
          ...item,
          score: parseFloat(item.score),
          percentage: parseFloat(item.percentage)
        })),
        // Keep other fields as they are
        dominant_learning_styles: rawData.dominant_learning_styles,
        learning_style_interpretation: rawData.learning_style_interpretation,
        result_description: rawData.result_description
      };
      
      return {
        ...response.data,
        data: convertedData
      };
    } catch (error) {
      console.error('❌ Failed to fetch test results:', error);
      
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to fetch test results. Please try again.');
      }
    }
  },

  // Helper method to start a complete test flow
  startTestFlow: async (): Promise<{ questionSet: VarkQuestionSet; test: VarkTest }> => {
    try {
      console.log('🚀 Starting complete test flow...');
      
      // 1. Get active question set
      const questionSetResponse = await varkAPI.getActiveQuestionSet();
      const questionSet = questionSetResponse.data;
      
      // 2. Create test with the question set
      const testResponse = await varkAPI.createTest(questionSet.id);
      const test = testResponse.data;
      
      console.log('✅ Test flow started successfully');
      return { questionSet, test };
    } catch (error) {
      console.error('❌ Failed to start test flow:', error);
      throw error;
    }
  }
};