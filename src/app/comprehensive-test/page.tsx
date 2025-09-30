"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  Check,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import CrossDeviceWarning from '@/components/CrossDeviceWarning';
import { useAuth } from '@/contexts/AuthContext';
import { comprehensiveAPI } from '@/lib/api/comprehensive';
import { ComprehensiveQuestionSet, ComprehensiveTest, ComprehensiveAnswer } from '@/lib/types';
import { ComprehensiveTestProgressManager, ComprehensiveTestProgress } from '@/lib/comprehensiveTestProgress';

// Import the background image
import TestChatBg from '@/assets/background/TestChatbg.png';

interface ChatMessage {
  sender: "ai" | "user";
  type: "text" | "slider_answer";
  text?: string;
  sliderValue?: number;
  questionId?: string;
}

interface TestState {
  step: 'loading' | 'ready' | 'testing' | 'submitting' | 'completed' | 'error';
  questionSet: ComprehensiveQuestionSet | null;
  test: ComprehensiveTest | null;
  currentQuestionIndex: number;
  answers: Record<string, ComprehensiveAnswer>;
  timeLeft: number;
  error: string | null;
}

/**
 * Comprehensive Test Interface Component
 * Provides a chat-based interface for conducting comprehensive assessments
 * that combine VARK, AI Knowledge, and Behavioral evaluations
 */
const ComprehensiveTestInterface = () => {
  const { isAuthenticated, user } = useAuth();

  const [testState, setTestState] = useState<TestState>({
    step: 'loading',
    questionSet: null,
    test: null,
    currentQuestionIndex: 0,
    answers: {},
    timeLeft: 0,
    error: null
  });

  const [currentSliderValue, setCurrentSliderValue] = useState(1.0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showCrossDeviceWarning, setShowCrossDeviceWarning] = useState(false);
  const [pendingTestId, setPendingTestId] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Memoized logging function
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`Comprehensive Test: ${message}`);
  }, []);

  // Auto-save progress to localStorage
  const saveProgressToStorage = useCallback(() => {
    if (!testState.test || !user || testState.step !== 'testing') return;

    const progress: ComprehensiveTestProgress = {
      testId: testState.test.id,
      userId: user.id,
      questionSetId: testState.questionSet?.id || '',
      questionSetName: testState.questionSet?.name || 'Comprehensive Assessment',
      currentQuestionIndex: testState.currentQuestionIndex,
      answers: testState.answers,
      startedAt: testState.test.started_at,
      lastSavedAt: new Date().toISOString(),
      timeLeft: testState.timeLeft,
      chatHistory: chatHistory,
      isCompleted: false,
      version: 1
    };

    ComprehensiveTestProgressManager.saveProgress(progress);
  }, [testState, chatHistory, user]);

  // Handle cross-device warning actions
  const handleContinueWithoutProgress = useCallback(async () => {
    setShowCrossDeviceWarning(false);

    if (!pendingTestId) return;

    try {
      const testResponse = await comprehensiveAPI.getTest(pendingTestId);
      const test = testResponse.data;

      if (test.status !== 'in_progress' || new Date(test.expires_at) < new Date()) {
        throw new Error('Test is no longer available');
      }

      // Create basic question set
      const questionSet: ComprehensiveQuestionSet = {
        id: '',
        version: 1,
        name: 'Comprehensive Assessment',
        active: true,
        created_at: test.started_at,
        updated_at: test.started_at,
        time_limit: test.time_limit,
        questions: test.questions
      };

      // Start fresh
      setTestState(prev => ({
        ...prev,
        step: 'testing',
        questionSet: questionSet,
        test: test,
        currentQuestionIndex: 0,
        answers: {},
        timeLeft: test.time_limit,
        error: null
      }));

      // Add first question to chat
      setChatHistory([{
        sender: "ai",
        type: "text",
        text: test.questions[0].body,
        questionId: test.questions[0].id
      }]);

      addLog('🔄 Started Comprehensive test without saved progress');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start test';
      addLog(`❌ Failed to start Comprehensive test: ${errorMessage}`);
      setTestState(prev => ({
        ...prev,
        step: 'error',
        error: 'Failed to start test. Please try again.'
      }));
    }

    setPendingTestId(null);
  }, [pendingTestId, addLog]);

  const handleStartNewTest = useCallback(() => {
    setShowCrossDeviceWarning(false);
    setPendingTestId(null);
    ComprehensiveTestProgressManager.clearProgress();
    window.location.href = '/comprehensive-test';
  }, []);

  // Initialize test flow with resume capability
  const initializeTest = useCallback(async () => {
    if (!isAuthenticated) {
      setTestState(prev => ({
        ...prev,
        step: 'error',
        error: 'Please login to start the Comprehensive test'
      }));
      return;
    }

    try {
      addLog('🚀 Starting Comprehensive test initialization...');
      setTestState(prev => ({ ...prev, step: 'loading' }));

      // Check for resume parameter
      const urlParams = new URLSearchParams(window.location.search);
      const resumeTestId = urlParams.get('resumeTestId');

      if (resumeTestId) {
        // Check if we have saved progress for this test
        const savedProgress = ComprehensiveTestProgressManager.loadProgress(resumeTestId);

        if (!savedProgress) {
          // No saved progress found - show cross-device warning
          addLog(`⚠️ No saved progress found for Comprehensive test: ${resumeTestId}`);
          setPendingTestId(resumeTestId);
          setShowCrossDeviceWarning(true);
          setTestState(prev => ({ ...prev, step: 'ready' }));
          return;
        }

        // Resume test logic (similar to other tests)
        addLog(`🔄 Resuming Comprehensive test from localStorage: ${resumeTestId}`);

        try {
          const testResponse = await comprehensiveAPI.getTest(resumeTestId);
          const test = testResponse.data;

          if (test.status !== 'in_progress') {
            throw new Error('Test is no longer in progress');
          }

          if (new Date(test.expires_at) < new Date()) {
            throw new Error('Test has expired');
          }

          // Create question set from saved progress
          const questionSet: ComprehensiveQuestionSet = {
            id: savedProgress.questionSetId,
            version: 1,
            name: savedProgress.questionSetName,
            active: true,
            created_at: savedProgress.startedAt,
            updated_at: savedProgress.lastSavedAt,
            time_limit: savedProgress.timeLeft,
            questions: test.questions
          };

          // Restore state from localStorage
          setTestState(prev => ({
            ...prev,
            step: 'testing',
            questionSet: questionSet,
            test: test,
            currentQuestionIndex: savedProgress.currentQuestionIndex,
            answers: savedProgress.answers,
            timeLeft: savedProgress.timeLeft,
            error: null
          }));

          setChatHistory(savedProgress.chatHistory);

          // Set slider to current question's saved answer if exists
          const currentQuestion = test.questions[savedProgress.currentQuestionIndex];
          const savedAnswer = savedProgress.answers[currentQuestion?.id];
          if (savedAnswer && currentQuestion) {
            const maxWeight = 5; // Hardcoded for comprehensive tests since backend doesn't provide max_weight
            const sliderValue = (savedAnswer.point / maxWeight) * maxWeight;
            setCurrentSliderValue(Math.max(1.0, sliderValue));
          }

          addLog(`✅ Comprehensive test resumed from question ${savedProgress.currentQuestionIndex + 1}`);
          return;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          addLog(`⚠️ Saved Comprehensive test is no longer valid: ${errorMessage}`);
          ComprehensiveTestProgressManager.clearProgress();
          setTestState(prev => ({
            ...prev,
            step: 'error',
            error: 'The test you\'re trying to resume is no longer available or has expired. Please start a new test.'
          }));
          return;
        }
      }

      // Check for existing progress when visiting /comprehensive-test directly
      const existingProgress = ComprehensiveTestProgressManager.loadProgress();
      if (existingProgress && !existingProgress.isCompleted) {
        addLog(`ℹ️ Found existing Comprehensive progress for test: ${existingProgress.testId}`);
        window.location.href = `/comprehensive-test?resumeTestId=${existingProgress.testId}`;
        return;
      }

      // Create new test
      const questionSetResponse = await comprehensiveAPI.getActiveQuestionSet();
      const questionSet = questionSetResponse.data;

      const testResponse = await comprehensiveAPI.createTest(questionSet.id);
      const test = testResponse.data;

      setTestState(prev => ({
        ...prev,
        step: 'ready',
        questionSet,
        test,
        timeLeft: test.time_limit === 0 ? 5400 : test.time_limit, // 1.5 hours default for comprehensive
        error: null
      }));

      addLog('🎯 New Comprehensive test ready to start!');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Comprehensive test';
      addLog(`❌ Comprehensive test initialization failed: ${errorMessage}`);
      setTestState(prev => ({
        ...prev,
        step: 'error',
        error: errorMessage
      }));
    }
  }, [isAuthenticated, addLog]);

  // Start the actual test
  const startTest = useCallback(() => {
    if (!testState.test) return;

    addLog('▶️ Starting Comprehensive test...');
    setTestState(prev => ({ ...prev, step: 'testing' }));

    // Add first question to chat
    const firstQuestion = testState.test.questions[0];
    setChatHistory([{
      sender: "ai",
      type: "text",
      text: firstQuestion.body,
      questionId: firstQuestion.id
    }]);

    setCurrentSliderValue(1.0);
  }, [testState.test, addLog]);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }, []);

  // Format duration for display
  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }, []);

  // Handle next question
  const handleNextQuestion = useCallback(async () => {
    const { test, currentQuestionIndex } = testState;
    if (!test) return;

    const currentQuestion = test.questions[currentQuestionIndex];
    const maxWeight = 5; // Hardcoded for comprehensive tests since backend doesn't provide max_weight

    const answer: ComprehensiveAnswer = {
      question_id: currentQuestion.id,
      category_id: currentQuestion.category.id,
      point: Math.round((currentSliderValue / maxWeight) * maxWeight * 10) / 10
    };

    // Add user's slider answer to chat history
    setChatHistory(prev => [...prev, {
      sender: "user",
      type: "slider_answer",
      sliderValue: currentSliderValue,
      questionId: currentQuestion.id
    }]);

    const newAnswers = {
      ...testState.answers,
      [currentQuestion.id]: answer
    };

    setTestState(prev => ({
      ...prev,
      answers: newAnswers
    }));

    addLog(`📝 Answered Comprehensive question ${currentQuestionIndex + 1}: ${currentSliderValue.toFixed(1)}/${maxWeight}`);

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < test.questions.length) {
      const nextQuestion = test.questions[nextIndex];
      setChatHistory(prev => [...prev, {
        sender: "ai",
        type: "text",
        text: nextQuestion.body,
        questionId: nextQuestion.id
      }]);

      setTestState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex
      }));
      setCurrentSliderValue(1.0);
    } else {
      // Submit comprehensive test
      addLog('🏁 All Comprehensive questions answered, submitting...');
      setTestState(prev => ({ ...prev, step: 'submitting' }));

      try {
        const submission = { answers: Object.values(newAnswers) };
        addLog(`📊 Submitting ${submission.answers.length} Comprehensive answers`);
        await comprehensiveAPI.submitAnswers(test.id, submission);

        addLog('✅ Comprehensive answers submitted successfully!');
        setTestState(prev => ({ ...prev, step: 'completed' }));

        setChatHistory(prev => [...prev, {
          sender: "ai",
          type: "text",
          text: "🎉 Congratulations! You have completed the Comprehensive Assessment. Your results are being processed..."
        }]);

        setTimeout(() => {
          window.location.href = `/comprehensive-test-results?testId=${test.id}`;
        }, 3000);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit Comprehensive answers';
        addLog(`❌ Comprehensive submission failed: ${errorMessage}`);
        setTestState(prev => ({
          ...prev,
          step: 'error',
          error: errorMessage
        }));
      }
    }
  }, [testState, currentSliderValue, addLog]);

  // SliderAnswer and SliderInput components (same as previous tests)
  const SliderAnswer = useCallback(({ value }: { value: number; questionId?: string }) => {
    const maxWeight = 5; // Hardcoded for comprehensive tests since backend doesn't provide max_weight
    const actualPoints = Math.round((value / maxWeight) * maxWeight * 10) / 10;

    return (
      <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl shadow-lg">
        <div className="grid grid-cols-2 gap-4 text-sm text-white/90 mb-4 font-medium">
          <span className="flex items-center justify-start">
            <span className="w-2 h-2 bg-white rounded-full mr-2 opacity-80"></span>
            Strongly Disagree
          </span>
          <span className="flex items-center justify-end">
            <span className="w-2 h-2 bg-white rounded-full mr-2 opacity-80"></span>
            Strongly Agree
          </span>
        </div>
        <div className="relative h-3 bg-white/20 rounded-full mb-4">
          <div
            className="absolute h-full bg-gradient-to-r from-green-400 to-blue-300 rounded-full transition-all duration-300"
            style={{ width: `${((value - 1) / (maxWeight - 1)) * 100}%` }}
          />
          <div
            className="absolute -top-1 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-blue-200 transition-all duration-300"
            style={{ left: `calc(${((value - 1) / (maxWeight - 1)) * 100}% - 10px)` }}
          />
        </div>
        <div className="text-center text-white space-y-1">
          <div className="text-sm opacity-90">{actualPoints.toFixed(1)}/{maxWeight} points</div>
        </div>
      </div>
    );
  }, []);

  const SliderInput = useCallback(({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
    const currentQuestion = testState.test?.questions[testState.currentQuestionIndex];
    const maxWeight = 5; // Hardcoded for comprehensive tests since backend doesn't provide max_weight

    return (
      <div className="w-full max-w-md bg-white p-4 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between text-sm text-gray-600 mb-4 font-medium">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
            Strongly Disagree
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
            Strongly Agree
          </span>
        </div>
        <div className="relative px-4 mb-4">
          <input
            type="range"
            min="1"
            max={maxWeight}
            step="0.1"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="slider w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none"
            style={{
              background: `linear-gradient(to right,
                #f87171 0%,
                #fbbf24 ${((value - 1) / (maxWeight - 1)) * 50}%,
                #34d399 ${((value - 1) / (maxWeight - 1)) * 100}%,
                #e5e7eb ${((value - 1) / (maxWeight - 1)) * 100}%,
                #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
            <span>1.0</span>
            {maxWeight > 2 && <span>{(maxWeight / 2).toFixed(1)}</span>}
            <span>{maxWeight.toFixed(1)}</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">
            Value: {value.toFixed(1)} | Category: {currentQuestion?.category.name || 'Unknown'} | Type: {currentQuestion?.category.type || 'Mixed'}
          </div>
        </div>
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 28px;
            width: 28px;
            border-radius: 50%;
            background: #2A3262;
            cursor: grab;
            border: 4px solid #ffffff;
            box-shadow: 0 4px 12px rgba(42, 50, 98, 0.4);
            transition: all 0.2s ease-in-out;
          }
          .slider::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(42, 50, 98, 0.5);
          }
          .slider::-webkit-slider-thumb:active {
            cursor: grabbing;
            transform: scale(1.15);
            box-shadow: 0 2px 8px rgba(42, 50, 98, 0.6);
          }
          .slider::-moz-range-thumb {
            height: 28px;
            width: 28px;
            border-radius: 50%;
            background: #2A3262;
            cursor: grab;
            border: 4px solid #ffffff;
            box-shadow: 0 4px 12px rgba(42, 50, 98, 0.4);
            transition: all 0.2s ease-in-out;
          }
          .slider::-moz-range-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(42, 50, 98, 0.5);
          }
          .slider::-moz-range-thumb:active {
            cursor: grabbing;
            transform: scale(1.15);
          }
          .slider::-moz-range-track {
            height: 8px;
            border-radius: 4px;
          }
        `}</style>
      </div>
    );
  }, [testState.test, testState.currentQuestionIndex]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Timer countdown
  useEffect(() => {
    if (testState.step !== 'testing' || testState.timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTestState(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          const { test, answers } = prev;
          if (test) {
            // Include current unsaved answer if exists
            const finalAnswers = {
              ...answers,
              ...(currentSliderValue > 0 && test.questions[prev.currentQuestionIndex] ? {
                [test.questions[prev.currentQuestionIndex].id]: {
                  question_id: test.questions[prev.currentQuestionIndex].id,
                  category_id: test.questions[prev.currentQuestionIndex].category.id,
                  point: Math.round((currentSliderValue / 5) * 5 * 10) / 10
                }
              } : {})
            };
            const submission = { answers: Object.values(finalAnswers) };
            comprehensiveAPI.submitAnswers(test.id, submission)
              .then(() => {
                addLog('✅ Time up - Comprehensive answers submitted successfully!');
                setTestState(current => ({ ...current, step: 'completed' }));
                setTimeout(() => {
                  window.location.href = `/comprehensive-test-results?testId=${test.id}`;
                }, 3000);
              })
              .catch((error) => {
                const errorMessage = error instanceof Error ? error.message : 'Failed to submit Comprehensive answers';
                addLog(`❌ Time up Comprehensive submission failed: ${errorMessage}`);
                setTestState(current => ({
                  ...current,
                  step: 'error',
                  error: errorMessage
                }));
              });
          }
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testState.step, testState.timeLeft, addLog, currentSliderValue]);

  // Auto-save progress during testing
  useEffect(() => {
    if (testState.step === 'testing') {
      saveProgressToStorage();
    }
  }, [testState.currentQuestionIndex, testState.answers, testState.step, saveProgressToStorage]);

  // Clear progress when test completes
  useEffect(() => {
    if (testState.step === 'completed') {
      ComprehensiveTestProgressManager.clearProgress();
    }
  }, [testState.step]);

  // Auto-initialize on mount
  useEffect(() => {
    if (isAuthenticated) {
      initializeTest();
    }
  }, [isAuthenticated, initializeTest]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4 text-yellow-700">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please login to start the Comprehensive test</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Cross-Device Warning Modal */}
      <CrossDeviceWarning
        isOpen={showCrossDeviceWarning}
        onClose={() => setShowCrossDeviceWarning(false)}
        onContinueAnyway={handleContinueWithoutProgress}
        onStartNew={handleStartNewTest}
        testInfo={testState.questionSet ? {
          questionSetName: testState.questionSet.name,
          timeLimit: testState.questionSet.time_limit
        } : undefined}
      />

      {/* Background */}
      <div className="fixed inset-0 z-0" style={{ backgroundColor: '#DFE4FF' }}>
        <Image
          src={TestChatBg}
          alt="Test Chat Background"
          fill
          className="object-cover object-center opacity-30"
          priority
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex-shrink-0">
        <Header currentPage="comprehensive-test" transparent />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col px-4 sm:px-6 py-4 max-w-6xl mx-auto w-full min-h-0">
        {/* Status & Timer */}
        <div className="flex-shrink-0 mb-4">
          {/* Mobile: Single consolidated bar */}
          <div className="sm:hidden">
            <div
              className="flex items-center justify-between px-4 py-3 rounded-lg text-white font-medium text-sm"
              style={{ backgroundColor: '#2A3262' }}
            >
              <div className="flex items-center gap-2">
                <span className="capitalize">
                  {testState.step.replace('_', ' ')}
                </span>
              </div>
              {testState.step === 'testing' && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(testState.timeLeft)}</span>
                </div>
              )}
              {testState.step === 'testing' && (
                <div className="flex items-center gap-1">
                  <span>
                    {testState.currentQuestionIndex + 1}/{testState.test?.questions.length || 0}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Original 2-bar layout */}
          <div className="hidden sm:grid sm:grid-cols-2 gap-4">
            {/* Status */}
            <div
              className="text-center py-4 rounded-lg text-white font-bold text-lg"
              style={{ backgroundColor: '#2A3262' }}
            >
              <div className="text-sm mb-1">Status</div>
              <div className="capitalize text-base">{testState.step.replace('_', ' ')}</div>
            </div>

            {/* Timer (only show during testing) */}
            {testState.step === 'testing' && (
              <div
                className="text-center py-4 rounded-lg text-white font-bold text-lg"
                style={{ backgroundColor: '#2A3262' }}
              >
                <div className="text-sm mb-1 flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" />
                  Time left
                </div>
                <div className="text-2xl">{formatTime(testState.timeLeft)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        {testState.step === 'loading' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Preparing Your Comprehensive Test...</h2>
              <p className="text-gray-600 text-sm sm:text-base">Setting up your Complete Assessment Suite</p>
            </div>
          </div>
        )}

        {testState.step === 'ready' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#2A3262' }}>Ready to Start!</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
                You&apos;re about to take the Comprehensive Assessment with{' '}
                <span className="font-semibold text-blue-600">{testState.questionSet?.questions.length} questions</span>.
                <br className="hidden sm:block" />
                You have <span className="font-semibold text-green-600">{formatDuration(testState.timeLeft)}</span> to complete this assessment.
                <br className="hidden sm:block" />
                This combines VARK, AI Knowledge, and Behavioral assessments for a complete profile.
              </p>
              <button
                onClick={startTest}
                className="flex items-center gap-2 mx-auto px-6 sm:px-8 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm sm:text-base"
                style={{ backgroundColor: '#2A3262' }}
              >
                Start Comprehensive Assessment
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        )}

        {testState.step === 'testing' && (
          <>
            {/* Chat History Container */}
            <div
              className="flex-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg mb-4 overflow-y-auto p-4 sm:p-6 min-h-0"
              ref={chatContainerRef}
            >
              <div className="space-y-4 sm:space-y-6">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-end gap-2 sm:gap-3 ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.sender === "ai" && (
                      <div className="flex-shrink-0">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#2A3262' }}
                        >
                          <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                        </div>
                      </div>
                    )}

                    {message.type === "text" && (
                      <div
                        className="max-w-[85%] sm:max-w-[70%] p-3 sm:p-4 rounded-lg text-white text-sm sm:text-base"
                        style={{ backgroundColor: '#DFE4FF', color: '#2A3262' }}
                      >
                        {message.text}
                      </div>
                    )}

                    {message.type === "slider_answer" && (
                      <div className="max-w-[90%] sm:max-w-[80%] p-3 sm:p-4 rounded-lg" style={{ backgroundColor: '#2A3262' }}>
                        <SliderAnswer value={message.sliderValue!} questionId={message.questionId} />
                      </div>
                    )}

                    {message.sender === "user" && (
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#2A3262' }}
                        >
                          <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed Bottom Section */}
            <div className="flex-shrink-0 space-y-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex items-center justify-center">
                  <SliderInput
                    value={currentSliderValue}
                    onChange={setCurrentSliderValue}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg gap-4">
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                  <div className="w-full sm:w-64 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: '#ABD305',
                        width: `${((testState.currentQuestionIndex + 1) / (testState.test?.questions.length || 1)) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center sm:text-left" style={{ color: '#2A3262' }}>
                    {testState.currentQuestionIndex + 1} out of {testState.test?.questions.length || 0} answered
                  </span>
                </div>

                <button
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
                  style={{ backgroundColor: '#2A3262' }}
                  onClick={handleNextQuestion}
                >
                  {testState.currentQuestionIndex >= (testState.test?.questions.length || 1) - 1 ? 'Finish Assessment' : 'Next Question'}
                </button>
              </div>
            </div>
          </>
        )}

        {testState.step === 'submitting' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Processing Your Comprehensive Results...</h2>
              <p className="text-gray-600 text-sm sm:text-base">Please wait while we analyze your complete assessment profile.</p>
            </div>
          </div>
        )}

        {testState.step === 'completed' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <Check className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-green-700">Comprehensive Assessment Completed!</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Your comprehensive assessment has been submitted successfully. Redirecting to your results...
              </p>
            </div>
          </div>
        )}

        {testState.step === 'error' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-red-700">Something went wrong</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">{testState.error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm sm:text-base"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Debug Logs */}
        {process.env.NODE_ENV === 'development' && logs.length > 0 && (
          <div className="flex-shrink-0 mt-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Debug Logs</h3>
            <div className="bg-gray-100 p-3 sm:p-4 rounded-lg max-h-32 sm:max-h-48 overflow-y-auto">
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-700">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveTestInterface;