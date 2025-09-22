// src/lib/aiKnowledgeTestProgress.ts
// AI Knowledge Test localStorage progress manager

import { AiKnowledgeAnswer } from './types';

interface ChatMessage {
  sender: "ai" | "user";
  type: "text" | "slider_answer";
  text?: string;
  sliderValue?: number;
  questionId?: string;
}

interface AiKnowledgeTestProgress {
  testId: string;
  userId: string;
  questionSetId: string;
  questionSetName: string;
  currentQuestionIndex: number;
  answers: Record<string, AiKnowledgeAnswer>;
  startedAt: string;
  lastSavedAt: string;
  timeLeft: number;
  chatHistory: ChatMessage[];
  isCompleted: boolean;
  version: number;
}

export class AiKnowledgeTestProgressManager {
  private static readonly STORAGE_KEY = 'ai_knowledge_test_progress';
  private static readonly MAX_STORAGE_TIME = 24 * 60 * 60 * 1000; // 24 hours

  // Save progress to localStorage
  static saveProgress(progress: AiKnowledgeTestProgress): void {
    try {
      const data = {
        ...progress,
        lastSavedAt: new Date().toISOString(),
        version: 1
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('📱 AI Knowledge Test progress saved locally:', {
        testId: progress.testId,
        questionIndex: progress.currentQuestionIndex,
        answersCount: Object.keys(progress.answers).length
      });
    } catch (error) {
      console.error('❌ Failed to save AI Knowledge Test progress:', error);
    }
  }

  // Load progress from localStorage
  static loadProgress(testId?: string): AiKnowledgeTestProgress | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const progress: AiKnowledgeTestProgress = JSON.parse(stored);

      // Check if progress is too old
      const lastSaved = new Date(progress.lastSavedAt).getTime();
      const now = Date.now();
      if (now - lastSaved > this.MAX_STORAGE_TIME) {
        console.log('🕐 Stored AI Knowledge Test progress expired, clearing...');
        this.clearProgress();
        return null;
      }

      // If testId specified, only return matching progress
      if (testId && progress.testId !== testId) {
        console.log('🔍 Requested AI Knowledge Test ID does not match stored progress');
        return null;
      }

      console.log('📱 AI Knowledge Test progress loaded:', {
        testId: progress.testId,
        questionIndex: progress.currentQuestionIndex,
        answersCount: Object.keys(progress.answers).length,
        lastSaved: progress.lastSavedAt
      });

      return progress;
    } catch (error) {
      console.error('❌ Failed to load AI Knowledge Test progress:', error);
      this.clearProgress();
      return null;
    }
  }

  // Clear progress from localStorage
  static clearProgress(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🧹 AI Knowledge Test progress cleared');
    } catch (error) {
      console.error('❌ Failed to clear AI Knowledge Test progress:', error);
    }
  }

  // Check if there's any saved progress
  static hasProgress(): boolean {
    return this.loadProgress() !== null;
  }

  // Get progress summary for display
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

export type { AiKnowledgeTestProgress, ChatMessage };