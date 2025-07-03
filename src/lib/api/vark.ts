import { apiClient } from './client';
import { ApiResponse, VarkQuestionSet, VarkTest, VarkSubmission } from '../types';

export const varkAPI = {
  // Get active question set
  getActiveQuestionSet: async (): Promise<ApiResponse<VarkQuestionSet>> => {
    const response = await apiClient.get('/users/vark_tests/active_question_set');
    return response.data;
  },

  // Create new VARK test
  createTest: async (questionSetId: string): Promise<ApiResponse<VarkTest>> => {
    const response = await apiClient.post('/users/vark_tests', {
      vark_question_set_id: questionSetId
    });
    return response.data;
  },

  // Get specific test (for history)
  getTest: async (testId: string): Promise<ApiResponse<VarkTest>> => {
    const response = await apiClient.get(`/users/vark_tests/${testId}`);
    return response.data;
  },

  // Submit test answers
  submitAnswers: async (testId: string, submission: VarkSubmission): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/users/vark_tests/${testId}/submit_answers`, submission);
    return response.data;
  },
};