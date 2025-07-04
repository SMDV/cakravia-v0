"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Check, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { varkAPI } from '@/lib/api';
import { VarkQuestionSet, VarkTest, VarkAnswer } from '@/lib/types';

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
  
  const [currentSliderValue, setCurrentSliderValue] = useState(50);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`VARK Test: ${message}`);
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Initialize test flow
  const initializeTest = async () => {
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
        timeLeft: test.time_limit || 3600, // Default 1 hour if no limit
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
  };

  // Start the actual test
  const startTest = () => {
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
  };

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

  const handleNextQuestion = useCallback(async () => {
    const { test, currentQuestionIndex } = testState;
    if (!test) return;

    const currentQuestion = test.questions[currentQuestionIndex];
    
    // Create answer object
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const submitAllAnswers = async () => {
    const { test, answers } = testState;
    if (!test) return;

    try {
      addLog('📤 Submitting all answers...');
      setTestState(prev => ({ ...prev, step: 'submitting' }));

      const submission = {
        answers: Object.values(answers)
      };

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
  };

  const SliderAnswer = ({ value }: { value: number }) => (
    <div className="w-full max-w-sm">
      <div className="flex justify-between text-xs text-white mb-2">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
      <div className="relative h-2 bg-white/30 rounded-full">
        <div
          className="absolute h-full bg-white rounded-full"
          style={{ width: `${value}%` }}
        />
        <div
          className="absolute -top-1.5 w-5 h-5 bg-white rounded-full shadow border border-white/50"
          style={{ left: `calc(${value}% - 10px)` }}
        />
      </div>
      <div className="text-center text-sm font-semibold mt-3 text-white">{value}</div>
    </div>
  );

  const SliderInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
    <div className="w-full max-w-md">
      <div className="flex justify-between text-sm text-gray-600 mb-4">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
      <div className="relative px-2">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-center text-xl font-bold mt-4" style={{ color: '#2A3262' }}>
          {value}
        </div>
      </div>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #2A3262;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 3px 8px rgba(42, 50, 98, 0.3);
          transition: all 0.2s ease-in-out;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(42, 50, 98, 0.4);
        }
      `}</style>
    </div>
  );

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
    <div className="min-h-screen" style={{ backgroundColor: '#DFE4FF', fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-800 rounded mr-2"></div>
          <span className="font-bold text-lg">logoipsum</span>
        </div>
        <nav className="flex items-center space-x-8">
          <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
          <Link href="/about" className="text-gray-700 hover:text-blue-600">About Us</Link>
          {user && (
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">{user.name}</span>
            </div>
          )}
        </nav>
      </header>

      <div className="flex justify-center py-8 px-6">
        <div className="w-full max-w-4xl">
          {/* Status & Timer */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Status */}
            <div 
              className="text-center py-4 rounded-lg text-white font-bold text-lg"
              style={{ backgroundColor: '#2A3262' }}
            >
              <div className="text-sm mb-1">Status</div>
              <div className="capitalize">{testState.step.replace('_', ' ')}</div>
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

          {/* Main Content Area */}
          {testState.step === 'loading' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Preparing Your Test...</h2>
              <p className="text-gray-600">Setting up your VARK Learning Style Assessment</p>
            </div>
          )}

          {testState.step === 'ready' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2A3262' }}>Ready to Start!</h2>
              <p className="text-gray-600 mb-6">
                You&apos;re about to take the VARK Learning Style Assessment with {testState.questionSet?.questions.length} questions.
                This will help you understand your learning preferences.
              </p>
              <button
                onClick={startTest}
                className="flex items-center gap-2 mx-auto px-8 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#2A3262' }}
              >
                Start Assessment
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {testState.step === 'testing' && (
            <>
              {/* Chat History Container */}
              <div 
                className="bg-white rounded-lg shadow-lg mb-6 h-96 overflow-y-auto p-6"
                ref={chatContainerRef}
              >
                <div className="space-y-6">
                  {chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex items-end gap-3 ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {/* AI Avatar (left side) */}
                      {message.sender === "ai" && (
                        <div className="flex-shrink-0">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#2A3262' }}
                          >
                            <User className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Message Content */}
                      {message.type === "text" && (
                        <div
                          className="max-w-[70%] p-4 rounded-lg text-white"
                          style={{ backgroundColor: '#ABD305' }}
                        >
                          {message.text}
                        </div>
                      )}

                      {message.type === "slider_answer" && (
                        <div
                          className="max-w-[70%] p-4 rounded-lg"
                          style={{ backgroundColor: '#2A3262' }}
                        >
                          <SliderAnswer value={message.sliderValue!} />
                        </div>
                      )}

                      {/* User Avatar (right side) */}
                      {message.sender === "user" && (
                        <div className="flex flex-col items-center gap-1">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#2A3262' }}
                          >
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Answer Input */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-center">
                  <SliderInput 
                    value={currentSliderValue}
                    onChange={setCurrentSliderValue}
                  />
                </div>
              </div>

              {/* Progress and Controls */}
              <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-64 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: '#ABD305',
                        width: `${((testState.currentQuestionIndex + 1) / (testState.test?.questions.length || 1)) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#2A3262' }}>
                    {testState.currentQuestionIndex + 1} out of {testState.test?.questions.length || 0} answered
                  </span>
                </div>
                
                <button 
                  className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#2A3262' }}
                  onClick={handleNextQuestion}
                >
                  {testState.currentQuestionIndex >= (testState.test?.questions.length || 1) - 1 ? 'Finish Assessment' : 'Next Question'}
                </button>
              </div>
            </>
          )}

          {testState.step === 'submitting' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Processing Your Results...</h2>
              <p className="text-gray-600">Please wait while we analyze your learning style preferences.</p>
            </div>
          )}

          {testState.step === 'completed' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-green-700">Assessment Completed!</h2>
              <p className="text-gray-600 mb-6">
                Your VARK assessment has been submitted successfully. Redirecting to your results...
              </p>
            </div>
          )}

          {testState.step === 'error' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-red-700">Something went wrong</h2>
              <p className="text-gray-600 mb-6">{testState.error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Debug Logs (only show in development) */}
          {process.env.NODE_ENV === 'development' && logs.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Debug Logs</h3>
              <div className="bg-gray-100 p-4 rounded-lg max-h-48 overflow-y-auto">
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