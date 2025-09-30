"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  Check,
  Clock,
  AlertCircle,
  ArrowRight,
  ZoomIn,
  X,
  ChevronUp
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import CrossDeviceWarning from '@/components/CrossDeviceWarning';
import { useAuth } from '@/contexts/AuthContext';
import { tpaAPI } from '@/lib/api/tpa';
import { TpaQuestionSet, TpaTest, TpaAnswer } from '@/lib/types';
import { TpaTestProgressManager, TpaTestProgress } from '@/lib/tpaTestProgress';

// Import the background image
import TestChatBg from '@/assets/background/TestChatbg.png';

interface ChatMessage {
  sender: "ai" | "user";
  type: "text" | "multiple_choice_answer";
  text?: string;
  selectedOption?: 'A' | 'B' | 'C' | 'D' | 'E';
  questionId?: string;
  questionImageUrl?: string;
}

interface TestState {
  step: 'loading' | 'ready' | 'testing' | 'submitting' | 'completed' | 'error';
  questionSet: TpaQuestionSet | null;
  test: TpaTest | null;
  currentQuestionIndex: number;
  answers: Record<string, TpaAnswer>;
  timeLeft: number;
  error: string | null;
}

/**
 * TPA Test Interface Component
 * Provides a visual-enhanced chat interface for conducting TPA assessments
 * with multiple choice input, image display, and progress tracking
 */
const TpaTestInterface = () => {
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

  const [currentSelectedOption, setCurrentSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showCrossDeviceWarning, setShowCrossDeviceWarning] = useState(false);
  const [pendingTestId, setPendingTestId] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  // State for mobile answer panel visibility
  const [showAnswerPanel, setShowAnswerPanel] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Memoized logging function
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`TPA Test: ${message}`);
  }, []);

  // Auto-save progress to localStorage
  const saveProgressToStorage = useCallback(() => {
    if (!testState.test || !user || testState.step !== 'testing') return;

    const progress: TpaTestProgress = {
      testId: testState.test.id,
      userId: user.id,
      questionSetId: testState.questionSet?.id || '',
      questionSetName: testState.questionSet?.name || 'TPA Assessment',
      currentQuestionIndex: testState.currentQuestionIndex,
      answers: testState.answers,
      startedAt: testState.test.started_at,
      lastSavedAt: new Date().toISOString(),
      timeLeft: testState.timeLeft,
      chatHistory: chatHistory,
      isCompleted: false,
      version: 1
    };

    TpaTestProgressManager.saveProgress(progress);
  }, [testState, chatHistory, user]);

  // Handle cross-device warning actions
  const handleContinueWithoutProgress = useCallback(async () => {
    setShowCrossDeviceWarning(false);

    if (!pendingTestId) return;

    try {
      const testResponse = await tpaAPI.getTest(pendingTestId);
      const test = testResponse.data;

      if (test.status !== 'in_progress' || new Date(test.expires_at) < new Date()) {
        throw new Error('Test is no longer available');
      }

      // Create basic question set
      const questionSet: TpaQuestionSet = {
        id: '',
        version: 1,
        name: 'TPA Assessment',
        active: true,
        created_at: test.started_at,
        updated_at: test.started_at,
        time_limit: test.time_limit,
        total_questions: test.questions.length,
        questions_by_category: {
          "Analytical Reasoning": 5,
          "Quantitative Reasoning": 5,
          "Spatial Reasoning": 5,
          "Verbal Reasoning": 5
        },
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
        text: test.questions[0].question_text,
        questionId: test.questions[0].id,
        questionImageUrl: test.questions[0].question_image_url
      }]);

      addLog('🔄 Started TPA test without saved progress');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start test';
      addLog(`❌ Failed to start TPA test: ${errorMessage}`);
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
    TpaTestProgressManager.clearProgress();
    window.location.href = '/tpa-test';
  }, []);

  // Initialize test flow with payment validation and resume capability
  const initializeTest = useCallback(async () => {
    if (!isAuthenticated) {
      setTestState(prev => ({
        ...prev,
        step: 'error',
        error: 'Please login to start the TPA test'
      }));
      return;
    }

    try {
      addLog('🚀 Starting TPA test initialization...');
      setTestState(prev => ({ ...prev, step: 'loading' }));

      // Check for order ID (payment-first flow)
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('orderId');
      const resumeTestId = urlParams.get('resumeTestId');

      // If no order ID and no resume test ID, redirect to payment page
      if (!orderId && !resumeTestId) {
        addLog('⚠️ No order ID found - redirecting to payment page');
        window.location.href = '/tpa-payment';
        return;
      }

      // If we have an order ID, validate payment before proceeding
      if (orderId && !resumeTestId) {
        try {
          addLog(`🔍 Validating payment for order: ${orderId}`);
          // For now, we'll proceed to test creation - the API will validate the order
          // In a real implementation, you might want to check order status first
          const { questionSet, test } = await tpaAPI.startTestFlow(orderId);

          setTestState(prev => ({
            ...prev,
            step: 'ready',
            questionSet,
            test,
            timeLeft: test.time_limit === 0 ? 3600 : test.time_limit,
            error: null
          }));

          addLog('✅ TPA test ready with paid order!');
          return;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Payment validation failed';
          addLog(`❌ Payment validation failed: ${errorMessage}`);

          // If payment validation fails, redirect to payment page
          if (errorMessage.includes('payment') || errorMessage.includes('order')) {
            addLog('🔄 Redirecting to payment page due to payment issue');
            window.location.href = '/tpa-payment';
            return;
          }

          // For other errors, show error state
          setTestState(prev => ({
            ...prev,
            step: 'error',
            error: errorMessage
          }));
          return;
        }
      }

      if (resumeTestId) {
        // Check if we have saved progress for this test
        const savedProgress = TpaTestProgressManager.loadProgress(resumeTestId);

        if (!savedProgress) {
          // No saved progress found - show cross-device warning
          addLog(`⚠️ No saved progress found for TPA test: ${resumeTestId}`);
          setPendingTestId(resumeTestId);
          setShowCrossDeviceWarning(true);
          setTestState(prev => ({ ...prev, step: 'ready' }));
          return;
        }

        // Saved progress found - resume the test
        addLog(`🔄 Resuming TPA test from localStorage: ${resumeTestId}`);

        try {
          const testResponse = await tpaAPI.getTest(resumeTestId);
          const test = testResponse.data;

          if (test.status !== 'in_progress') {
            throw new Error('Test is no longer in progress');
          }

          if (new Date(test.expires_at) < new Date()) {
            throw new Error('Test has expired');
          }

          // Create question set from saved progress
          const questionSet: TpaQuestionSet = {
            id: savedProgress.questionSetId,
            version: 1,
            name: savedProgress.questionSetName,
            active: true,
            created_at: savedProgress.startedAt,
            updated_at: savedProgress.lastSavedAt,
            time_limit: savedProgress.timeLeft,
            total_questions: test.questions.length,
            questions_by_category: {
              "Analytical Reasoning": 5,
              "Quantitative Reasoning": 5,
              "Spatial Reasoning": 5,
              "Verbal Reasoning": 5
            },
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

          // Set current selected option if exists for current question
          const currentQuestion = test.questions[savedProgress.currentQuestionIndex];
          const savedAnswer = savedProgress.answers[currentQuestion?.id];
          if (savedAnswer && currentQuestion) {
            setCurrentSelectedOption(savedAnswer.selected_option);
          }

          addLog(`✅ TPA test resumed from question ${savedProgress.currentQuestionIndex + 1}`);
          return;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          addLog(`⚠️ Saved TPA test is no longer valid: ${errorMessage}`);
          TpaTestProgressManager.clearProgress();
          setTestState(prev => ({
            ...prev,
            step: 'error',
            error: 'The test you\'re trying to resume is no longer available or has expired. Please start a new test.'
          }));
          return;
        }
      }

      // Check for existing progress when visiting /tpa-test directly
      const existingProgress = TpaTestProgressManager.loadProgress();
      if (existingProgress && !existingProgress.isCompleted) {
        addLog(`ℹ️ Found existing TPA progress for test: ${existingProgress.testId}`);
        window.location.href = `/tpa-test?resumeTestId=${existingProgress.testId}`;
        return;
      }

      // If we reach here without order ID or resume test ID, redirect to payment
      addLog('⚠️ No valid order or resume test found - redirecting to payment page');
      window.location.href = '/tpa-payment';

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize TPA test';
      addLog(`❌ TPA test initialization failed: ${errorMessage}`);
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

    addLog('▶️ Starting TPA test...');
    setTestState(prev => ({ ...prev, step: 'testing' }));

    // Add first question to chat
    const firstQuestion = testState.test.questions[0];
    setChatHistory([{
      sender: "ai",
      type: "text",
      text: firstQuestion.question_text,
      questionId: firstQuestion.id,
      questionImageUrl: firstQuestion.question_image_url
    }]);

    // Reset current selection
    setCurrentSelectedOption(null);
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

  // Handle next question with localStorage saving
  const handleNextQuestion = useCallback(async () => {
    const { test, currentQuestionIndex } = testState;
    if (!test || !currentSelectedOption) return;

    const currentQuestion = test.questions[currentQuestionIndex];

    // Create TPA answer
    const answer: TpaAnswer = {
      tpa_question_id: currentQuestion.id,
      selected_option: currentSelectedOption
    };

    // Add user's multiple choice answer to chat history
    setChatHistory(prev => [...prev, {
      sender: "user",
      type: "multiple_choice_answer",
      selectedOption: currentSelectedOption,
      questionId: currentQuestion.id
    }]);

    // Store answer
    const newAnswers = {
      ...testState.answers,
      [currentQuestion.id]: answer
    };

    setTestState(prev => ({
      ...prev,
      answers: newAnswers
    }));

    addLog(`📝 Answered TPA question ${currentQuestionIndex + 1}: Option ${currentSelectedOption}`);

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < test.questions.length) {
      // Add next question to chat history
      const nextQuestion = test.questions[nextIndex];
      setChatHistory(prev => [...prev, {
        sender: "ai",
        type: "text",
        text: nextQuestion.question_text,
        questionId: nextQuestion.id,
        questionImageUrl: nextQuestion.question_image_url
      }]);

      setTestState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex
      }));
      setCurrentSelectedOption(null); // Reset selection for next question
    } else {
      // All questions completed, submit answers
      addLog('🏁 All TPA questions answered, submitting...');
      setTestState(prev => ({ ...prev, step: 'submitting' }));

      try {
        const submission = { answers: Object.values(newAnswers) };
        addLog(`📊 Submitting ${submission.answers.length} TPA answers`);
        await tpaAPI.submitAnswers(test.id, submission);

        addLog('✅ TPA answers submitted successfully!');
        setTestState(prev => ({ ...prev, step: 'completed' }));

        // Add completion message to chat
        setChatHistory(prev => [...prev, {
          sender: "ai",
          type: "text",
          text: "🎉 Congratulations! You have completed the TPA Assessment. Your results are being processed..."
        }]);

        // Redirect to results page after a short delay
        setTimeout(() => {
          window.location.href = `/tpa-test-results?testId=${test.id}`;
        }, 3000);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit TPA answers';
        addLog(`❌ TPA submission failed: ${errorMessage}`);
        setTestState(prev => ({
          ...prev,
          step: 'error',
          error: errorMessage
        }));
      }
    }
  }, [testState, currentSelectedOption, addLog]);

  // Image modal handlers
  const handleImageClick = useCallback((imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
    setModalImageUrl(null);
  }, []);

  // MultipleChoiceAnswer Component for displaying answers in chat
  const MultipleChoiceAnswer = useCallback(({ option, questionId }: { option: 'A' | 'B' | 'C' | 'D' | 'E'; questionId?: string }) => {
    const currentQuestion = testState.test?.questions.find(q => q.id === questionId);
    const optionText = currentQuestion ? currentQuestion[`option_${option.toLowerCase()}` as keyof typeof currentQuestion] as string : `Option ${option}`;

    return (
      <div className="text-white space-y-1">
        <div className="text-sm sm:text-base">
          <span className="font-bold">Answer: {option}</span>
        </div>
        <div className="text-xs sm:text-sm italic opacity-90">
          {optionText}
        </div>
      </div>
    );
  }, [testState.test]);

  // MultipleChoiceInput Component for user input
  const MultipleChoiceInput = useCallback(({ value, onChange }: {
    value: 'A' | 'B' | 'C' | 'D' | 'E' | null;
    onChange: (value: 'A' | 'B' | 'C' | 'D' | 'E') => void
  }) => {
    const currentQuestion = testState.test?.questions[testState.currentQuestionIndex];
    if (!currentQuestion) return null;

    const options: Array<{key: 'A' | 'B' | 'C' | 'D' | 'E', text: string}> = [
      { key: 'A', text: currentQuestion.option_a },
      { key: 'B', text: currentQuestion.option_b },
      { key: 'C', text: currentQuestion.option_c },
      { key: 'D', text: currentQuestion.option_d },
      { key: 'E', text: currentQuestion.option_e }
    ];

    return (
      <div className="w-full max-w-2xl bg-white p-4 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-4">
          <h4 className="text-lg font-semibold" style={{ color: '#2A3262' }}>
            Choose your answer:
          </h4>
          <div className="text-sm text-gray-600 mt-1">
            Category: {currentQuestion.category}
          </div>
        </div>

        <div className="space-y-3">
          {options.map(({ key, text }) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`w-full p-3 text-left rounded-lg border-2 transition-all duration-200 ${
                value === key
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                  value === key
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-400 text-gray-600'
                }`}>
                  {key}
                </div>
                <div className="flex-1 text-sm leading-relaxed">
                  {text}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }, [testState.test, testState.currentQuestionIndex]);

  // Enhanced Chat Message with Image Support
  const EnhancedChatMessage = useCallback(({ message, index }: { message: ChatMessage; index: number }) => {
    return (
      <div
        key={index}
        className={`flex items-end gap-2 sm:gap-3 ${
          message.sender === "user" ? "justify-end" : "justify-start"
        }`}
      >
        {/* AI Avatar (left side) */}
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

        {/* Message Content */}
        {message.type === "text" && (
          <div className="max-w-[85%] sm:max-w-[70%]">
            <div
              className="p-3 sm:p-4 rounded-lg text-sm sm:text-base"
              style={{ backgroundColor: '#DFE4FF', color: '#2A3262' }}
            >
              {message.text}
            </div>

            {/* Image display if available */}
            {message.questionImageUrl && (
              <div className="mt-2">
                <div
                  className="relative border rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick(message.questionImageUrl!)}
                >
                  <Image
                    src={message.questionImageUrl}
                    alt="Question visual"
                    width={400}
                    height={300}
                    className="w-full h-auto max-h-64 object-contain bg-white"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {message.type === "multiple_choice_answer" && (
          <div className="max-w-[90%] sm:max-w-[80%] p-3 sm:p-4 rounded-lg" style={{ backgroundColor: '#2A3262' }}>
            <MultipleChoiceAnswer option={message.selectedOption!} questionId={message.questionId} />
          </div>
        )}

        {/* User Avatar (right side) */}
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
    );
  }, [handleImageClick, MultipleChoiceAnswer]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Timer countdown (only during testing)
  useEffect(() => {
    if (testState.step !== 'testing' || testState.timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTestState(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          // Auto-submit when time is up
          const { test, answers } = prev;
          if (test) {
            const submission = { answers: Object.values(answers) };
            tpaAPI.submitAnswers(test.id, submission)
              .then(() => {
                addLog('✅ Time up - TPA answers submitted successfully!');
                setTestState(current => ({ ...current, step: 'completed' }));
                setTimeout(() => {
                  window.location.href = `/tpa-test-results?testId=${test.id}`;
                }, 3000);
              })
              .catch((error) => {
                const errorMessage = error instanceof Error ? error.message : 'Failed to submit TPA answers';
                addLog(`❌ Time up TPA submission failed: ${errorMessage}`);
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
  }, [testState.step, testState.timeLeft, addLog]);

  // Auto-save progress whenever state changes during testing
  useEffect(() => {
    if (testState.step === 'testing') {
      saveProgressToStorage();
    }
  }, [testState.currentQuestionIndex, testState.answers, testState.step, saveProgressToStorage]);

  // Clear progress when test completes
  useEffect(() => {
    if (testState.step === 'completed') {
      TpaTestProgressManager.clearProgress();
    }
  }, [testState.step]);

  // Auto-initialize on mount
  useEffect(() => {
    if (isAuthenticated) {
      initializeTest();
    }
  }, [isAuthenticated, initializeTest]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4 text-yellow-700">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please login to start the TPA test</p>
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

      {/* Image Modal */}
      {showImageModal && modalImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-75"
            >
              <X className="w-6 h-6" />
            </button>
            <Image
              src={modalImageUrl}
              alt="Question visual - enlarged"
              width={800}
              height={600}
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Background with Color */}
      <div className="fixed inset-0 z-0" style={{ backgroundColor: '#DFE4FF' }}>
        <Image
          src={TestChatBg}
          alt="Test Chat Background"
          fill
          className="object-cover object-center opacity-30"
          style={{
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto'
          }}
          priority
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex-shrink-0">
        <Header currentPage="tpa-test" transparent />
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
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Preparing Your TPA Test...</h2>
              <p className="text-gray-600 text-sm sm:text-base">Setting up your visual reasoning assessment</p>
            </div>
          </div>
        )}

        {testState.step === 'ready' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#2A3262' }}>Ready to Start!</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
                You&apos;re about to take the TPA (Test of Potential Ability) with{' '}
                <span className="font-semibold text-blue-600">{testState.questionSet?.total_questions} questions</span>.
                <br className="hidden sm:block" />
                You have <span className="font-semibold text-green-600">{formatDuration(testState.timeLeft)}</span> to complete this assessment.
                <br className="hidden sm:block" />
                This test includes visual reasoning questions across 4 categories.
              </p>
              <button
                onClick={startTest}
                className="flex items-center gap-2 mx-auto px-6 sm:px-8 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm sm:text-base"
                style={{ backgroundColor: '#2A3262' }}
              >
                Start TPA Assessment
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        )}

        {testState.step === 'testing' && (
          <div className={`flex-1 flex flex-col sm:flex-row gap-4 min-h-0 relative transition-all duration-300 ${showAnswerPanel ? 'sm:mb-0 mb-[35vh]' : 'sm:mb-0 mb-20'}`}>
            {/* Mobile: Full Screen Question Box */}
            <div className="flex-1 sm:flex-[7] flex flex-col min-h-0">
              {/* Chat History Container */}
              <div
                className="flex-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-y-auto p-3 sm:p-6 min-h-0"
                ref={chatContainerRef}
              >
                <div className="space-y-3 sm:space-y-6">
                  {chatHistory.map((message, index) => (
                    <EnhancedChatMessage key={index} message={message} index={index} />
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Right Side Answer Section */}
            <div className="hidden sm:flex sm:flex-[3] flex-col gap-4 min-h-0">
              {/* Input Section - Desktop Only */}
              <div className="flex flex-col gap-4 h-full">
                {/* Current Answer Input - Takes remaining space, scrollable */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 sm:p-4 flex-1 min-h-0 overflow-y-auto">
                  <MultipleChoiceInput
                    value={currentSelectedOption}
                    onChange={setCurrentSelectedOption}
                  />
                </div>

                {/* Progress and Controls - Fixed height, always visible */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg flex-shrink-0">
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: '#ABD305',
                            width: `${((testState.currentQuestionIndex + 1) / (testState.test?.questions.length || 1)) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-center" style={{ color: '#2A3262' }}>
                        {testState.currentQuestionIndex + 1} out of {testState.test?.questions.length || 0} answered
                      </span>
                    </div>

                    <button
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-opacity text-sm sm:text-base ${
                        currentSelectedOption
                          ? 'text-white hover:opacity-90'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      style={{ backgroundColor: currentSelectedOption ? '#2A3262' : '#E5E7EB' }}
                      onClick={handleNextQuestion}
                      disabled={!currentSelectedOption}
                    >
                      {testState.currentQuestionIndex >= (testState.test?.questions.length || 1) - 1 ? 'Finish Assessment' : 'Next Question'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile: Floating Submit/Next Button */}
        {testState.step === 'testing' && (
          <div className={`sm:hidden fixed z-20 transition-all duration-300 ${
            showAnswerPanel
              ? 'bottom-[30vh] right-4'
              : 'bottom-20 right-4'
          }`}>
            <button
              onClick={handleNextQuestion}
              disabled={!currentSelectedOption}
              className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
                currentSelectedOption
                  ? 'hover:opacity-90 hover:scale-105'
                  : 'opacity-60 cursor-not-allowed'
              }`}
              style={{ backgroundColor: currentSelectedOption ? '#2A3262' : '#94A3B8' }}
            >
              <div className="flex flex-col items-center">
                <ArrowRight className="w-4 h-4 text-white mb-0.5" />
                <span className="text-[10px] text-white font-medium leading-tight">
                  {testState.currentQuestionIndex >= (testState.test?.questions.length || 1) - 1 ? 'Submit' : 'Next'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Mobile: Smart Choice Status Bar */}
        {testState.step === 'testing' && (
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-10">
            <button
              onClick={() => setShowAnswerPanel(!showAnswerPanel)}
              className="w-full bg-white border-t border-gray-300 shadow-2xl p-4 transition-all duration-300 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentSelectedOption ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium" style={{ color: '#2A3262' }}>
                          Selected: {currentSelectedOption}
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const currentQuestion = testState.test?.questions[testState.currentQuestionIndex];
                            const optionText = currentQuestion ? currentQuestion[`option_${currentSelectedOption.toLowerCase()}` as keyof typeof currentQuestion] as string : '';
                            return optionText.length > 40 ? optionText.substring(0, 40) + '...' : optionText;
                          })()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
                        <span className="text-xs text-gray-400">?</span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium" style={{ color: '#2A3262' }}>
                          Tap to choose answer
                        </div>
                        <div className="text-xs text-gray-600">
                          {testState.test?.questions[testState.currentQuestionIndex]?.category || 'Multiple choice question'}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress and Toggle Indicator */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-600">
                      {testState.currentQuestionIndex + 1}/{testState.test?.questions.length || 0}
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: '#ABD305',
                          width: `${((testState.currentQuestionIndex + 1) / (testState.test?.questions.length || 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  <ChevronUp
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      showAnswerPanel ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Mobile: Collapsible Choice Panel */}
        {testState.step === 'testing' && showAnswerPanel && (
          <div className="sm:hidden fixed inset-x-0 bottom-20 z-10 bg-white border-t border-gray-300 shadow-2xl transform transition-transform duration-300 ease-out h-[25vh]">
            <div className="p-4 h-full overflow-y-auto">
              {/* Answer Choices Only */}
              <MultipleChoiceInput
                value={currentSelectedOption}
                onChange={setCurrentSelectedOption}
              />
            </div>
          </div>
        )}

        {testState.step === 'submitting' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Processing Your TPA Results...</h2>
              <p className="text-gray-600 text-sm sm:text-base">Please wait while we analyze your reasoning abilities.</p>
            </div>
          </div>
        )}

        {testState.step === 'completed' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <Check className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-green-700">TPA Assessment Completed!</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Your TPA assessment has been submitted successfully. Redirecting to your results...
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

        {/* Debug Logs (only show in development) */}
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

export default TpaTestInterface;