"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Check, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { varkAPI } from '@/lib/api';
import { VarkQuestionSet, VarkTest, VarkAnswer } from '@/lib/types';
import Header from '@/components/Header';

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
  questionSet: VarkQuestionSet | null;
  test: VarkTest | null;
  currentQuestionIndex: number;
  answers: Record<string, VarkAnswer>;
  timeLeft: number;
  error: string | null;
}

const TestInterface = () => {
  const { isAuthenticated } = useAuth();
  const [testState, setTestState] = useState<TestState>({
    step: 'loading',
    questionSet: null,
    test: null,
    currentQuestionIndex: 0,
    answers: {},
    timeLeft: 0,
    error: null
  });
  
  const [currentSliderValue, setCurrentSliderValue] = useState(50);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Memoized logging function
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`VARK Test: ${message}`);
  }, []);

  // Initialize test flow
  const initializeTest = useCallback(async () => {
    if (!isAuthenticated) {
      setTestState(prev => ({ 
        ...prev, 
        step: 'error', 
        error: 'Please login to start the test' 
      }));
      return;
    }

    try {
      addLog('🚀 Starting VARK test initialization...');
      setTestState(prev => ({ ...prev, step: 'loading' }));

      // Step 1: Get active question set
      addLog('📝 Fetching active question set...');
      const questionSetResponse = await varkAPI.getActiveQuestionSet();
      const questionSet = questionSetResponse.data;
      addLog(`✅ Got question set: ${questionSet.name} (${questionSet.questions.length} questions)`);

      // Step 2: Create test
      addLog('🔨 Creating new test instance...');
      const testResponse = await varkAPI.createTest(questionSet.id);
      const test = testResponse.data;
      addLog(`✅ Test created with ID: ${test.id}`);

      // Update state
      setTestState(prev => ({
        ...prev,
        step: 'ready',
        questionSet,
        test,
        timeLeft: test.time_limit === 0 ? 3600 : test.time_limit, // 60 minutes if 0, otherwise use API value
        error: null
      }));

      addLog('🎯 Test ready to start!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize test';
      addLog(`❌ Initialization failed: ${errorMessage}`);
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
    
    addLog('▶️ Starting test...');
    setTestState(prev => ({ ...prev, step: 'testing' }));
    
    // Add first question to chat
    const firstQuestion = testState.test.questions[0];
    setChatHistory([{
      sender: "ai",
      type: "text",
      text: firstQuestion.body,
      questionId: firstQuestion.id
    }]);
  }, [testState.test, addLog]);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }, []);

  // Format duration for display (e.g., "60 minutes" or "1 hour 30 minutes")
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

  // Handle next question and submission
  const handleNextQuestion = useCallback(async () => {
    const { test, currentQuestionIndex } = testState;
    if (!test) return;

    const currentQuestion = test.questions[currentQuestionIndex];
    
    // Create answer object using actual max_weight from API
    const answer: VarkAnswer = {
      question_id: currentQuestion.id,
      category_id: currentQuestion.category.id,
      point: Math.round((currentSliderValue / 100) * currentQuestion.max_weight)
    };

    // Add user's slider answer to chat history
    setChatHistory(prev => [...prev, { 
      sender: "user", 
      type: "slider_answer", 
      sliderValue: currentSliderValue,
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

    addLog(`📝 Answered question ${currentQuestionIndex + 1}: ${answer.point}/${currentQuestion.max_weight} points`);

    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < test.questions.length) {
      // Add next question to chat history
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
      setCurrentSliderValue(50); // Reset slider for next question
    } else {
      // All questions completed, submit answers directly
      addLog('🏁 All questions answered, submitting...');
      setTestState(prev => ({ ...prev, step: 'submitting' }));

      try {
        const submission = { answers: Object.values(newAnswers) };
        addLog(`📊 Submitting ${submission.answers.length} answers`);
        await varkAPI.submitAnswers(test.id, submission);
        
        addLog('✅ Answers submitted successfully!');
        setTestState(prev => ({ ...prev, step: 'completed' }));
        
        // Add completion message to chat
        setChatHistory(prev => [...prev, {
          sender: "ai",
          type: "text",
          text: "🎉 Congratulations! You have completed the VARK Learning Style Assessment. Your results are being processed..."
        }]);
        
        // Redirect to results page after a short delay
        setTimeout(() => {
          window.location.href = `/results?testId=${test.id}`;
        }, 3000);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit answers';
        addLog(`❌ Submission failed: ${errorMessage}`);
        setTestState(prev => ({ 
          ...prev, 
          step: 'error', 
          error: errorMessage 
        }));
      }
    }
  }, [testState, currentSliderValue, addLog]);

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
          // Auto-submit when time is up using current state
          const { test, answers } = prev;
          if (test) {
            const submission = { answers: Object.values(answers) };
            varkAPI.submitAnswers(test.id, submission)
              .then(() => {
                addLog('✅ Time up - answers submitted successfully!');
                setTestState(current => ({ ...current, step: 'completed' }));
                setTimeout(() => {
                  window.location.href = `/results?testId=${test.id}`;
                }, 3000);
              })
              .catch((error) => {
                const errorMessage = error instanceof Error ? error.message : 'Failed to submit answers';
                addLog(`❌ Time up submission failed: ${errorMessage}`);
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

  // Auto-initialize on mount
  useEffect(() => {
    if (isAuthenticated) {
      initializeTest();
    }
  }, [isAuthenticated, initializeTest]);

  // Slider Answer Component - Enhanced design
  const SliderAnswer = useCallback(({ value, questionId }: { value: number; questionId?: string }) => {
    // Get current question to show actual point value
    const currentQuestion = testState.test?.questions.find(q => q.id === questionId);
    const maxWeight = currentQuestion?.max_weight || 5;
    const actualPoints = Math.round((value / 100) * maxWeight);

    return (
      <div className="w-full max-w-lg"> {/* Expanded from max-w-sm to max-w-lg */}
        <div className="flex justify-between text-sm text-white/90 mb-4 font-medium px-2"> {/* Better spacing and readability */}
          <span>Strongly Disagree</span>
          <span>Strongly Agree</span>
        </div>
        
        {/* Enhanced slider track */}
        <div className="relative h-4 bg-white/20 rounded-full mb-6"> {/* Increased height and margin */}
          <div
            className="absolute h-full bg-gradient-to-r from-green-400 to-blue-300 rounded-full transition-all duration-300"
            style={{ width: `${value}%` }}
          />
          <div
            className="absolute -top-1 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-blue-200 transition-all duration-300"
            style={{ left: `calc(${value}% - 12px)` }}
          />
        </div>
        
        {/* Display both percentage and actual points with better spacing */}
        <div className="text-center text-white space-y-2"> {/* Added space-y-2 for better spacing */}
          <div className="text-2xl font-bold">{value}%</div> {/* Larger text */}
          <div className="text-base opacity-90">{actualPoints}/{maxWeight} points</div> {/* Larger text and better opacity */}
        </div>
      </div>
    );
  }, [testState.test]);

  // Slider Input Component - Enhanced design with better dragging
  const SliderInput = useCallback(({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
    // Get current question to show max weight
    const currentQuestion = testState.test?.questions[testState.currentQuestionIndex];
    const maxWeight = currentQuestion?.max_weight || 5;
    const actualPoints = Math.round((value / 100) * maxWeight);

    return (
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between text-sm text-gray-600 mb-6 font-medium">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
            Strongly Disagree
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
            Strongly Agree
          </span>
        </div>
        
        <div className="relative px-4 mb-6"> {/* Added more padding */}
          {/* Enhanced slider with gradient track and better dragging */}
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="slider w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none"
            style={{
              background: `linear-gradient(to right, 
                #f87171 0%, 
                #fbbf24 ${value/2}%, 
                #34d399 ${value}%, 
                #e5e7eb ${value}%, 
                #e5e7eb 100%)`
            }}
          />
        </div>
        
        {/* Enhanced display */}
        <div className="text-center">
          <div className="text-3xl font-bold mb-2" style={{ color: '#2A3262' }}>
            {value}%
          </div>
          <div className="text-lg text-gray-600 mb-1">
            {actualPoints} / {maxWeight} points
          </div>
          <div className="text-sm text-gray-500">
            Category: {currentQuestion?.category.name || 'Unknown'}
          </div>
        </div>

        {/* Custom slider styles */}
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

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4 text-yellow-700">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please login to start the VARK test</p>
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
    <div className="min-h-screen relative" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
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
      <Header currentPage="test" transparent />

      <div className="relative z-10 flex justify-center py-4 sm:py-8 px-4 sm:px-6">
        <div className="w-full max-w-6xl">
          {/* Status & Timer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
            {/* Status */}
            <div 
              className="text-center py-3 sm:py-4 rounded-lg text-white font-bold text-base sm:text-lg"
              style={{ backgroundColor: '#2A3262' }}
            >
              <div className="text-xs sm:text-sm mb-1">Status</div>
              <div className="capitalize text-sm sm:text-base">{testState.step.replace('_', ' ')}</div>
            </div>

            {/* Timer (only show during testing) */}
            {testState.step === 'testing' && (
              <div 
                className="text-center py-3 sm:py-4 rounded-lg text-white font-bold text-base sm:text-lg"
                style={{ backgroundColor: '#2A3262' }}
              >
                <div className="text-xs sm:text-sm mb-1 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  Time left
                </div>
                <div className="text-lg sm:text-2xl">{formatTime(testState.timeLeft)}</div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          {testState.step === 'loading' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Preparing Your Test...</h2>
              <p className="text-gray-600 text-sm sm:text-base">Setting up your VARK Learning Style Assessment</p>
            </div>
          )}

          {testState.step === 'ready' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#2A3262' }}>Ready to Start!</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
                You&apos;re about to take the VARK Learning Style Assessment with{' '}
                <span className="font-semibold text-blue-600">{testState.questionSet?.questions.length} questions</span>.
                <br className="hidden sm:block" />
                You have <span className="font-semibold text-green-600">{formatDuration(testState.timeLeft)}</span> to complete this assessment.
                <br className="hidden sm:block" />
                This will help you understand your learning preferences.
              </p>
              <button
                onClick={startTest}
                className="flex items-center gap-2 mx-auto px-6 sm:px-8 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm sm:text-base"
                style={{ backgroundColor: '#2A3262' }}
              >
                Start Assessment
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          {testState.step === 'testing' && (
            <>
              {/* Chat History Container */}
              <div 
                className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg mb-4 sm:mb-6 h-64 sm:h-96 overflow-y-auto p-4 sm:p-6"
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
                        <div
                          className="max-w-[85%] sm:max-w-[70%] p-3 sm:p-4 rounded-lg text-white text-sm sm:text-base"
                          style={{ backgroundColor: '#ABD305' }}
                        >
                          {message.text}
                        </div>
                      )}

                      {message.type === "slider_answer" && (
                        <div className="max-w-[85%] sm:max-w-[70%]">
                          <SliderAnswer value={message.sliderValue!} questionId={message.questionId} />
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
                  ))}
                </div>
              </div>

              {/* Current Answer Input */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-center justify-center">
                  <SliderInput 
                    value={currentSliderValue}
                    onChange={setCurrentSliderValue}
                  />
                </div>
              </div>

              {/* Progress and Controls */}
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
            </>
          )}

          {testState.step === 'submitting' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Processing Your Results...</h2>
              <p className="text-gray-600 text-sm sm:text-base">Please wait while we analyze your learning style preferences.</p>
            </div>
          )}

          {testState.step === 'completed' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 text-center">
              <Check className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-green-700">Assessment Completed!</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Your VARK assessment has been submitted successfully. Redirecting to your results...
              </p>
            </div>
          )}

          {testState.step === 'error' && (
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
          )}

          {/* Debug Logs (only show in development) */}
          {process.env.NODE_ENV === 'development' && logs.length > 0 && (
            <div className="mt-4 sm:mt-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6">
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
    </div>
  );
};

export default TestInterface;