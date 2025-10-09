/**
 * @fileoverview Behavioral Test API Client
 *
 * This module provides API client methods for the Behavioral Assessment feature.
 * The behavioral test evaluates users across multiple behavioral dimensions to understand
 * their learning behaviors, decision-making patterns, and study habits.
 *
 * Key Features:
 * - Question set management with versioning
 * - Test session management with expiration handling
 * - Progress tracking and resume capability
 * - Answer submission with validation
 * - Results retrieval with score conversion
 * - Complete test flow orchestration
 *
 * Implementation Pattern:
 * This follows the same architectural pattern as the AI Knowledge and VARK assessments,
 * ensuring consistency across the application. The API handles:
 * - Authentication via HTTP-only cookies
 * - Error handling with user-friendly messages
 * - Data type conversion (string to number) for scores
 * - localStorage integration for progress persistence
 *
 * @author Claude Code Assistant
 * @created 2024-09-24
 */

import { apiClient } from './client';
import { ApiResponse, BehavioralQuestionSet, BehavioralTest, BehavioralSubmission, BehavioralTestResults } from '../types';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Behavioral Test API client
 * Provides methods for managing behavioral assessments including test creation,
 * answer submission, and results retrieval.
 */
export const behavioralAPI = {
  /**
   * Get the active behavioral question set
   * @returns Promise<ApiResponse<BehavioralQuestionSet>> The active question set with all questions
   */
  getActiveQuestionSet: async (): Promise<ApiResponse<BehavioralQuestionSet>> => {
    try {
      console.log('🔄 Fetching Behavioral Test active question set...');
      const response = await apiClient.get('/users/behavioral_learning_tests/active_question_set');
      console.log('✅ Behavioral Test active question set response:', response.data);
      return response.data; // API returns { data: questionSet, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to fetch Behavioral Test active question set:', error);
      throw error;
    }
  },

  /**
   * Create a new behavioral test instance
   * @param questionSetId - The ID of the question set to use for this test
   * @returns Promise<ApiResponse<BehavioralTest>> The created test instance
   */
  createTest: async (questionSetId: string): Promise<ApiResponse<BehavioralTest>> => {
    try {
      console.log('🔄 Creating Behavioral Test with question set ID:', questionSetId);
      const response = await apiClient.post('/users/behavioral_learning_tests', {
        behavioral_learning_question_set_id: questionSetId
      });
      console.log('✅ Behavioral Test creation response:', response.data);
      return response.data; // API returns { data: test, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to create Behavioral Test:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to create Behavioral Test. Please try again.');
      }
    }
  },

  /**
   * Get a specific behavioral test by ID
   * @param testId - The ID of the test to retrieve
   * @returns Promise<ApiResponse<BehavioralTest>> The test instance with questions
   */
  getTest: async (testId: string): Promise<ApiResponse<BehavioralTest>> => {
    try {
      console.log('🔄 Fetching Behavioral Test:', testId);
      const response = await apiClient.get(`/users/behavioral_learning_tests/${testId}`);
      console.log('✅ Behavioral Test response:', response.data);
      return response.data; // API returns { data: test, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to fetch Behavioral Test:', error);
      throw error;
    }
  },

  /**
   * Submit answers for a behavioral test
   * @param testId - The ID of the test to submit answers for
   * @param submission - Object containing the array of answers
   * @returns Promise<ApiResponse<Record<string, unknown>>> Submission confirmation
   */
  submitAnswers: async (testId: string, submission: BehavioralSubmission): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      console.log('🔄 Submitting Behavioral Test answers for test:', testId);
      console.log('📝 Behavioral Test submission data:', submission);

      const response = await apiClient.post(`/users/behavioral_learning_tests/${testId}/submit_answers`, submission);
      console.log('✅ Submit Behavioral Test answers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to submit Behavioral Test answers:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to submit Behavioral Test answers. Please try again.');
      }
    }
  },

  /**
   * Get behavioral test results by test ID
   * @param testId - The ID of the test to get results for (use 'latest' for most recent)
   * @returns Promise<ApiResponse<BehavioralTestResults>> The test results with scores and analysis
   */
  getTestResults: async (testId: string): Promise<ApiResponse<BehavioralTestResults>> => {
    try {
      console.log('🔄 Fetching Behavioral Test results for:', testId);
      const response = await apiClient.get(`/users/behavioral_learning_tests/${testId}/results`);
      console.log('✅ Behavioral Test results response:', response.data);

      // The API might return string values that need to be converted to numbers
      // Following the same pattern as AI Knowledge API
      const rawData = response.data.data;

      // Convert string values to numbers for consistent data handling if needed
      const convertedData: BehavioralTestResults = {
        ...rawData,
        // Convert behavioral dimension scores (4 specific dimensions)
        h_score: typeof rawData.h_score === 'string' ? parseFloat(rawData.h_score) : rawData.h_score,
        m_score: typeof rawData.m_score === 'string' ? parseFloat(rawData.m_score) : rawData.m_score,
        r_score: typeof rawData.r_score === 'string' ? parseFloat(rawData.r_score) : rawData.r_score,
        e_score: typeof rawData.e_score === 'string' ? parseFloat(rawData.e_score) : rawData.e_score,
        average_score: typeof rawData.average_score === 'string' ? parseFloat(rawData.average_score) : rawData.average_score,
        level_label: rawData.level_label || '',
        min_score: typeof rawData.min_score === 'string' ? parseFloat(rawData.min_score) : rawData.min_score,
        max_score: typeof rawData.max_score === 'string' ? parseFloat(rawData.max_score) : rawData.max_score,
        total_score: typeof rawData.total_score === 'string' ? parseFloat(rawData.total_score) : rawData.total_score,
        scores_breakdown: rawData.scores_breakdown?.map((item: { score: string | number; percentage: string | number; [key: string]: unknown }) => ({
          ...item,
          score: typeof item.score === 'string' ? parseFloat(item.score) : item.score,
          percentage: typeof item.percentage === 'string' ? parseFloat(item.percentage) : item.percentage
        })) || [],
        // Keep other fields as they are
        dominant_dimensions: rawData.dominant_dimensions || [],
        dimension_interpretations: rawData.dimension_interpretations || {},
        result_description: rawData.result_description || {
          title: '',
          description: '',
          recommendations: '',
          behavioral_profile: ''
        }
      };

      return {
        ...response.data,
        data: convertedData
      };
    } catch (error) {
      console.error('❌ Failed to fetch Behavioral Test results:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to fetch Behavioral Test results. Please try again.');
      }
    }
  },

  /**
   * Helper method to start a complete behavioral test flow
   * Combines getting the question set and creating a test in one call
   * @returns Promise<{questionSet: BehavioralQuestionSet, test: BehavioralTest}> Complete test setup
   */
  startTestFlow: async (): Promise<{ questionSet: BehavioralQuestionSet; test: BehavioralTest }> => {
    try {
      console.log('🚀 Starting complete Behavioral Test flow...');

      // 1. Get active question set
      const questionSetResponse = await behavioralAPI.getActiveQuestionSet();
      const questionSet = questionSetResponse.data;

      // 2. Create test with the question set
      const testResponse = await behavioralAPI.createTest(questionSet.id);
      const test = testResponse.data;

      console.log('✅ Behavioral Test flow started successfully');
      return { questionSet, test };
    } catch (error) {
      console.error('❌ Failed to start Behavioral Test flow:', error);
      throw error;
    }
  },

  /**
   * Download Behavioral test certificate
   * @param testId - The ID of the test to download certificate for
   * @returns Promise<Blob> The certificate file as a blob
   */
  downloadCertificate: async (testId: string): Promise<Blob> => {
    try {
      console.log('🔄 Downloading Behavioral certificate for test:', testId);
      const response = await apiClient.get(`/users/behavioral_learning_tests/${testId}/orders/download_certificate`, {
        responseType: 'blob'
      });
      console.log('✅ Behavioral certificate downloaded successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to download Behavioral certificate:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to download certificate. Please ensure payment is completed.');
      }
    }
  }
};