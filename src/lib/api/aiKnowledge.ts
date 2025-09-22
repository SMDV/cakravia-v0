import { apiClient } from './client';
import { ApiResponse, AiKnowledgeQuestionSet, AiKnowledgeTest, AiKnowledgeSubmission, AiKnowledgeTestResults } from '../types';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export const aiKnowledgeAPI = {
  // Get active question set
  getActiveQuestionSet: async (): Promise<ApiResponse<AiKnowledgeQuestionSet>> => {
    try {
      console.log('🔄 Fetching AI Knowledge active question set...');
      const response = await apiClient.get('/users/ai_knowledge_tests/active_question_set');
      console.log('✅ AI Knowledge active question set response:', response.data);
      return response.data; // API returns { data: questionSet, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to fetch AI Knowledge active question set:', error);
      throw error;
    }
  },

  // Create new AI Knowledge test
  createTest: async (questionSetId: string): Promise<ApiResponse<AiKnowledgeTest>> => {
    try {
      console.log('🔄 Creating AI Knowledge test with question set ID:', questionSetId);
      const response = await apiClient.post('/users/ai_knowledge_tests', {
        ai_knowledge_question_set_id: questionSetId
      });
      console.log('✅ AI Knowledge test creation response:', response.data);
      return response.data; // API returns { data: test, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to create AI Knowledge test:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to create AI Knowledge test. Please try again.');
      }
    }
  },

  // Get specific test (for history)
  getTest: async (testId: string): Promise<ApiResponse<AiKnowledgeTest>> => {
    try {
      console.log('🔄 Fetching AI Knowledge test:', testId);
      const response = await apiClient.get(`/users/ai_knowledge_tests/${testId}`);
      console.log('✅ AI Knowledge test response:', response.data);
      return response.data; // API returns { data: test, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to fetch AI Knowledge test:', error);
      throw error;
    }
  },

  // Submit test answers
  submitAnswers: async (testId: string, submission: AiKnowledgeSubmission): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      console.log('🔄 Submitting AI Knowledge answers for test:', testId);
      console.log('📝 AI Knowledge submission data:', submission);

      const response = await apiClient.post(`/users/ai_knowledge_tests/${testId}/submit_answers`, submission);
      console.log('✅ Submit AI Knowledge answers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to submit AI Knowledge answers:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to submit AI Knowledge answers. Please try again.');
      }
    }
  },

  // Get AI Knowledge test results
  getTestResults: async (testId: string): Promise<ApiResponse<AiKnowledgeTestResults>> => {
    try {
      console.log('🔄 Fetching AI Knowledge test results for:', testId);
      const response = await apiClient.get(`/users/ai_knowledge_tests/${testId}/results`);
      console.log('✅ AI Knowledge test results response:', response.data);

      // The API might return string values that need to be converted to numbers
      // Following the same pattern as VARK API
      const rawData = response.data.data;

      // Convert string values to numbers for consistent data handling if needed
      const convertedData: AiKnowledgeTestResults = {
        ...rawData,
        pe_score: typeof rawData.pe_score === 'string' ? parseFloat(rawData.pe_score) : rawData.pe_score,
        ee_score: typeof rawData.ee_score === 'string' ? parseFloat(rawData.ee_score) : rawData.ee_score,
        si_score: typeof rawData.si_score === 'string' ? parseFloat(rawData.si_score) : rawData.si_score,
        fc_score: typeof rawData.fc_score === 'string' ? parseFloat(rawData.fc_score) : rawData.fc_score,
        hm_score: typeof rawData.hm_score === 'string' ? parseFloat(rawData.hm_score) : rawData.hm_score,
        pv_score: typeof rawData.pv_score === 'string' ? parseFloat(rawData.pv_score) : rawData.pv_score,
        ht_score: typeof rawData.ht_score === 'string' ? parseFloat(rawData.ht_score) : rawData.ht_score,
        bi_score: typeof rawData.bi_score === 'string' ? parseFloat(rawData.bi_score) : rawData.bi_score,
        min_score: typeof rawData.min_score === 'string' ? parseFloat(rawData.min_score) : rawData.min_score,
        max_score: typeof rawData.max_score === 'string' ? parseFloat(rawData.max_score) : rawData.max_score,
        total_score: typeof rawData.total_score === 'string' ? parseFloat(rawData.total_score) : rawData.total_score,
        scores_breakdown: rawData.scores_breakdown?.map((item: any) => ({
          ...item,
          score: typeof item.score === 'string' ? parseFloat(item.score) : item.score,
          percentage: typeof item.percentage === 'string' ? parseFloat(item.percentage) : item.percentage
        })) || [],
        // Keep other fields as they are
        dominant_categories: rawData.dominant_categories || [],
        category_interpretations: rawData.category_interpretations || {},
        result_description: rawData.result_description || {
          title: '',
          description: '',
          recommendations: '',
          ai_readiness_level: ''
        }
      };

      return {
        ...response.data,
        data: convertedData
      };
    } catch (error) {
      console.error('❌ Failed to fetch AI Knowledge test results:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to fetch AI Knowledge test results. Please try again.');
      }
    }
  },

  // Helper method to start a complete test flow
  startTestFlow: async (): Promise<{ questionSet: AiKnowledgeQuestionSet; test: AiKnowledgeTest }> => {
    try {
      console.log('🚀 Starting complete AI Knowledge test flow...');

      // 1. Get active question set
      const questionSetResponse = await aiKnowledgeAPI.getActiveQuestionSet();
      const questionSet = questionSetResponse.data;

      // 2. Create test with the question set
      const testResponse = await aiKnowledgeAPI.createTest(questionSet.id);
      const test = testResponse.data;

      console.log('✅ AI Knowledge test flow started successfully');
      return { questionSet, test };
    } catch (error) {
      console.error('❌ Failed to start AI Knowledge test flow:', error);
      throw error;
    }
  }
};