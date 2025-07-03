import { apiClient } from './client';
import { ApiResponse, VarkQuestionSet, VarkTest, VarkSubmission, VarkTestResults } from '../types';
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
      return response.data; // API returns { data: results, status: "ok", error: false }
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