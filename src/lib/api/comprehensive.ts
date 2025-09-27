/**
 * @fileoverview Comprehensive Test API Client
 *
 * This module provides API client methods for the Comprehensive Assessment feature.
 * The comprehensive test combines VARK learning styles, AI knowledge evaluation, and
 * behavioral analysis into a single, unified assessment experience.
 *
 * Key Features:
 * - Multi-dimensional assessment (VARK + AI Knowledge + Behavioral)
 * - Extended test sessions with longer time limits
 * - Comprehensive results with cross-assessment analysis
 * - Advanced scoring with multiple category types
 * - Complete learning profile generation
 * - Certificate with comprehensive insights
 *
 * Architecture:
 * The comprehensive test reuses the established patterns from individual assessments
 * while adding complexity to handle multiple assessment types within one interface.
 * Questions are tagged with type indicators ('vark', 'ai_knowledge', 'behavioral')
 * to enable proper categorization and scoring.
 *
 * Data Flow:
 * 1. Question set contains mixed questions from all assessment types
 * 2. User answers are collected uniformly using the slider interface
 * 3. Backend separates answers by type for individual scoring
 * 4. Results combine all dimensions into a comprehensive profile
 * 5. UI displays integrated results with type-specific insights
 *
 * @author Claude Code Assistant
 * @created 2024-09-24
 */

import { apiClient } from './client';
import { ApiResponse, ComprehensiveQuestionSet, ComprehensiveTest, ComprehensiveSubmission, ComprehensiveTestResults } from '../types';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Comprehensive Test API client
 * Provides methods for managing comprehensive assessments that combine multiple assessment types
 * including test creation, answer submission, and results retrieval.
 */
export const comprehensiveAPI = {
  /**
   * Get the active comprehensive question set
   * @returns Promise<ApiResponse<ComprehensiveQuestionSet>> The active question set with all questions
   */
  getActiveQuestionSet: async (): Promise<ApiResponse<ComprehensiveQuestionSet>> => {
    try {
      console.log('🔄 Fetching Comprehensive Test active question set...');
      const response = await apiClient.get('/users/comprehensive_assessment_tests/active_question_set');
      console.log('✅ Comprehensive Test active question set response:', response.data);
      return response.data; // API returns { data: questionSet, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to fetch Comprehensive Test active question set:', error);
      throw error;
    }
  },

  /**
   * Create a new comprehensive test instance
   * @param questionSetId - The ID of the question set to use for this test
   * @returns Promise<ApiResponse<ComprehensiveTest>> The created test instance
   */
  createTest: async (questionSetId: string): Promise<ApiResponse<ComprehensiveTest>> => {
    try {
      console.log('🔄 Creating Comprehensive Test with question set ID:', questionSetId);
      const response = await apiClient.post('/users/comprehensive_assessment_tests', {
        comprehensive_question_set_id: questionSetId
      });
      console.log('✅ Comprehensive Test creation response:', response.data);
      return response.data; // API returns { data: test, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to create Comprehensive Test:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to create Comprehensive Test. Please try again.');
      }
    }
  },

  /**
   * Get a specific comprehensive test by ID
   * @param testId - The ID of the test to retrieve
   * @returns Promise<ApiResponse<ComprehensiveTest>> The test instance with questions
   */
  getTest: async (testId: string): Promise<ApiResponse<ComprehensiveTest>> => {
    try {
      console.log('🔄 Fetching Comprehensive Test:', testId);
      const response = await apiClient.get(`/users/comprehensive_assessment_tests/${testId}`);
      console.log('✅ Comprehensive Test response:', response.data);
      return response.data; // API returns { data: test, status: "ok", error: false }
    } catch (error) {
      console.error('❌ Failed to fetch Comprehensive Test:', error);
      throw error;
    }
  },

  /**
   * Submit answers for a comprehensive test
   * @param testId - The ID of the test to submit answers for
   * @param submission - Object containing the array of answers
   * @returns Promise<ApiResponse<Record<string, unknown>>> Submission confirmation
   */
  submitAnswers: async (testId: string, submission: ComprehensiveSubmission): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      console.log('🔄 Submitting Comprehensive Test answers for test:', testId);
      console.log('📝 Comprehensive Test submission data:', submission);

      const response = await apiClient.post(`/users/comprehensive_assessment_tests/${testId}/submit_answers`, submission);
      console.log('✅ Submit Comprehensive Test answers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to submit Comprehensive Test answers:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to submit Comprehensive Test answers. Please try again.');
      }
    }
  },

  /**
   * Get comprehensive test results by test ID
   * @param testId - The ID of the test to get results for (use 'latest' for most recent)
   * @returns Promise<ApiResponse<ComprehensiveTestResults>> The test results with scores and analysis
   */
  getTestResults: async (testId: string): Promise<ApiResponse<ComprehensiveTestResults>> => {
    try {
      console.log('🔄 Fetching Comprehensive Test results for:', testId);
      const response = await apiClient.get(`/users/comprehensive_assessment_tests/${testId}/results`);
      console.log('✅ Comprehensive Test results response:', response.data);

      // The API might return string values that need to be converted to numbers
      // Following the same pattern as AI Knowledge API
      const rawData = response.data.data;

      // Convert string values to numbers for consistent data handling if needed
      const convertedData: ComprehensiveTestResults = {
        ...rawData,
        // Convert comprehensive assessment dimension scores
        cf_score: typeof rawData.cf_score === 'string' ? parseFloat(rawData.cf_score) : rawData.cf_score,
        r_score: typeof rawData.r_score === 'string' ? parseFloat(rawData.r_score) : rawData.r_score,
        ma_score: typeof rawData.ma_score === 'string' ? parseFloat(rawData.ma_score) : rawData.ma_score,
        ag_score: typeof rawData.ag_score === 'string' ? parseFloat(rawData.ag_score) : rawData.ag_score,
        e_score: typeof rawData.e_score === 'string' ? parseFloat(rawData.e_score) : rawData.e_score,
        average_score: typeof rawData.average_score === 'string' ? parseFloat(rawData.average_score) : rawData.average_score,
        level_label: rawData.level_label || '',
        // Summary scores
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
          comprehensive_profile: ''
        }
      };

      return {
        ...response.data,
        data: convertedData
      };
    } catch (error) {
      console.error('❌ Failed to fetch Comprehensive Test results:', error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message);
      } else {
        throw new Error('Failed to fetch Comprehensive Test results. Please try again.');
      }
    }
  },

  /**
   * Helper method to start a complete comprehensive test flow
   * Combines getting the question set and creating a test in one call
   * @returns Promise<{questionSet: ComprehensiveQuestionSet, test: ComprehensiveTest}> Complete test setup
   */
  startTestFlow: async (): Promise<{ questionSet: ComprehensiveQuestionSet; test: ComprehensiveTest }> => {
    try {
      console.log('🚀 Starting complete Comprehensive Test flow...');

      // 1. Get active question set
      const questionSetResponse = await comprehensiveAPI.getActiveQuestionSet();
      const questionSet = questionSetResponse.data;

      // 2. Create test with the question set
      const testResponse = await comprehensiveAPI.createTest(questionSet.id);
      const test = testResponse.data;

      console.log('✅ Comprehensive Test flow started successfully');
      return { questionSet, test };
    } catch (error) {
      console.error('❌ Failed to start Comprehensive Test flow:', error);
      throw error;
    }
  }
};