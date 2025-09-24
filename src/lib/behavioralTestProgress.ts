// src/lib/behavioralTestProgress.ts
// Behavioral Test localStorage progress manager

import { BehavioralAnswer } from './types';

interface ChatMessage {
  sender: "ai" | "user";
  type: "text" | "slider_answer";
  text?: string;
  sliderValue?: number;
  questionId?: string;
}

/**
 * Interface for behavioral test progress data stored in localStorage
 */
interface BehavioralTestProgress {
  testId: string;
  userId: string;
  questionSetId: string;
  questionSetName: string;
  currentQuestionIndex: number;
  answers: Record<string, BehavioralAnswer>;
  startedAt: string;
  lastSavedAt: string;
  timeLeft: number;
  chatHistory: ChatMessage[];
  isCompleted: boolean;
  version: number;
}

/**
 * Manager class for handling behavioral test progress persistence in localStorage
 * Provides methods to save, load, and manage test progress across browser sessions
 */
export class BehavioralTestProgressManager {
  private static readonly STORAGE_KEY = 'behavioral_test_progress';
  private static readonly MAX_STORAGE_TIME = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Save behavioral test progress to localStorage
   * @param progress - The progress data to save
   */
  static saveProgress(progress: BehavioralTestProgress): void {
    try {
      const data = {
        ...progress,
        lastSavedAt: new Date().toISOString(),
        version: 1
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('📱 Behavioral Test progress saved locally:', {
        testId: progress.testId,
        questionIndex: progress.currentQuestionIndex,
        answersCount: Object.keys(progress.answers).length
      });
    } catch (error) {
      console.error('❌ Failed to save Behavioral Test progress:', error);
    }
  }

  /**
   * Load behavioral test progress from localStorage
   * @param testId - Optional test ID to match against stored progress
   * @returns The stored progress or null if not found/expired
   */
  static loadProgress(testId?: string): BehavioralTestProgress | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const progress: BehavioralTestProgress = JSON.parse(stored);

      // Check if progress is too old
      const lastSaved = new Date(progress.lastSavedAt).getTime();
      const now = Date.now();
      if (now - lastSaved > this.MAX_STORAGE_TIME) {
        console.log('🕐 Stored Behavioral Test progress expired, clearing...');
        this.clearProgress();
        return null;
      }

      // If testId specified, only return matching progress
      if (testId && progress.testId !== testId) {
        console.log('🔍 Requested Behavioral Test ID does not match stored progress');
        return null;
      }

      console.log('📱 Behavioral Test progress loaded:', {
        testId: progress.testId,
        questionIndex: progress.currentQuestionIndex,
        answersCount: Object.keys(progress.answers).length,
        lastSaved: progress.lastSavedAt
      });

      return progress;
    } catch (error) {
      console.error('❌ Failed to load Behavioral Test progress:', error);
      this.clearProgress();
      return null;
    }
  }

  /**
   * Clear behavioral test progress from localStorage
   */
  static clearProgress(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🧹 Behavioral Test progress cleared');
    } catch (error) {
      console.error('❌ Failed to clear Behavioral Test progress:', error);
    }
  }

  /**
   * Check if there's any saved behavioral test progress
   * @returns true if progress exists, false otherwise
   */
  static hasProgress(): boolean {
    return this.loadProgress() !== null;
  }

  /**
   * Get a summary of the stored progress for display purposes
   * @returns Progress summary object with completion statistics
   */
  static getProgressSummary(): {
    exists: boolean;
    testId?: string;
    progress?: number;
    questionsAnswered?: number;
    totalQuestions?: number;
    lastSaved?: string;
    timeLeft?: number;
  } {
    const progress = this.loadProgress();
    if (!progress) {
      return { exists: false };
    }

    const totalQuestions = progress.chatHistory.filter(msg => msg.sender === 'ai' && msg.type === 'text').length;

    return {
      exists: true,
      testId: progress.testId,
      progress: totalQuestions > 0 ? (progress.currentQuestionIndex / totalQuestions) * 100 : 0,
      questionsAnswered: progress.currentQuestionIndex,
      totalQuestions: totalQuestions,
      lastSaved: progress.lastSavedAt,
      timeLeft: progress.timeLeft
    };
  }
}

export type { BehavioralTestProgress, ChatMessage };