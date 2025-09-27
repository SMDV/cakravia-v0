// src/lib/tpaTestProgress.ts
// TPA Test localStorage progress manager

import { TpaAnswer } from './types';

interface ChatMessage {
  sender: "ai" | "user";
  type: "text" | "multiple_choice_answer";
  text?: string;
  selectedOption?: 'A' | 'B' | 'C' | 'D' | 'E';
  questionId?: string;
  questionImageUrl?: string; // For visual questions
}

/**
 * Interface for TPA test progress data stored in localStorage
 */
export interface TpaTestProgress {
  testId: string;
  userId: string;
  questionSetId: string;
  questionSetName: string;
  currentQuestionIndex: number;
  answers: Record<string, TpaAnswer>;
  startedAt: string;
  lastSavedAt: string;
  timeLeft: number;
  chatHistory: ChatMessage[];
  isCompleted: boolean;
  version: number;
}

/**
 * Manager class for handling TPA test progress persistence in localStorage
 * Provides methods to save, load, and manage test progress across browser sessions
 */
export class TpaTestProgressManager {
  private static readonly STORAGE_KEY = 'tpa_test_progress';
  private static readonly MAX_STORAGE_TIME = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Save TPA test progress to localStorage
   * @param progress - The progress data to save
   */
  static saveProgress(progress: TpaTestProgress): void {
    try {
      const data = {
        ...progress,
        lastSavedAt: new Date().toISOString(),
        version: 1
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('💾 TPA test progress saved to localStorage:', {
        testId: data.testId,
        currentQuestionIndex: data.currentQuestionIndex,
        answersCount: Object.keys(data.answers).length,
        timeLeft: data.timeLeft
      });
    } catch (error) {
      console.error('❌ Failed to save TPA test progress:', error);
    }
  }

  /**
   * Load TPA test progress from localStorage
   * @param testId - Optional test ID to load specific test progress
   * @returns The loaded progress data or null if not found/expired
   */
  static loadProgress(testId?: string): TpaTestProgress | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('📂 No TPA test progress found in localStorage');
        return null;
      }

      const progress: TpaTestProgress = JSON.parse(stored);

      // Check if progress is expired (older than MAX_STORAGE_TIME)
      const lastSaved = new Date(progress.lastSavedAt).getTime();
      const now = new Date().getTime();
      if (now - lastSaved > this.MAX_STORAGE_TIME) {
        console.log('⏰ TPA test progress expired, clearing...');
        this.clearProgress();
        return null;
      }

      // If specific testId requested, check if it matches
      if (testId && progress.testId !== testId) {
        console.log(`🔍 Requested test ID ${testId} doesn't match stored progress ${progress.testId}`);
        return null;
      }

      console.log('📂 TPA test progress loaded from localStorage:', {
        testId: progress.testId,
        currentQuestionIndex: progress.currentQuestionIndex,
        answersCount: Object.keys(progress.answers).length,
        timeLeft: progress.timeLeft,
        lastSavedAt: progress.lastSavedAt
      });

      return progress;
    } catch (error) {
      console.error('❌ Failed to load TPA test progress:', error);
      // Clear corrupted data
      this.clearProgress();
      return null;
    }
  }

  /**
   * Clear TPA test progress from localStorage
   */
  static clearProgress(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ TPA test progress cleared from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear TPA test progress:', error);
    }
  }

  /**
   * Check if there is any saved progress in localStorage
   * @returns True if progress exists and is not expired
   */
  static hasProgress(): boolean {
    return this.loadProgress() !== null;
  }

  /**
   * Update existing progress with new data
   * @param updates - Partial progress data to update
   */
  static updateProgress(updates: Partial<TpaTestProgress>): void {
    const existingProgress = this.loadProgress();
    if (existingProgress) {
      const updatedProgress = {
        ...existingProgress,
        ...updates,
        lastSavedAt: new Date().toISOString()
      };
      this.saveProgress(updatedProgress);
    }
  }

  /**
   * Get progress completion percentage
   * @param progress - The progress data
   * @param totalQuestions - Total number of questions in the test
   * @returns Completion percentage (0-100)
   */
  static getCompletionPercentage(progress: TpaTestProgress, totalQuestions: number): number {
    const answeredQuestions = Object.keys(progress.answers).length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  }

  /**
   * Check if test is expired based on time remaining
   * @param progress - The progress data
   * @returns True if test is expired
   */
  static isTestExpired(progress: TpaTestProgress): boolean {
    return progress.timeLeft <= 0;
  }

  /**
   * Get formatted time remaining
   * @param progress - The progress data
   * @returns Formatted time string
   */
  static getFormattedTimeRemaining(progress: TpaTestProgress): string {
    const seconds = progress.timeLeft;
    if (seconds <= 0) return 'Expired';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s remaining`;
    } else {
      return `${remainingSeconds}s remaining`;
    }
  }
}