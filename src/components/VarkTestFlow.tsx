"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { varkAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { VarkQuestionSet, VarkTest, VarkAnswer } from '@/lib/types';
import { User, Clock, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface TestState {
  step: 'loading' | 'ready' | 'testing' | 'submitting' | 'completed' | 'error';
  questionSet: VarkQuestionSet | null;
  test: VarkTest | null;
  currentQuestionIndex: number;
  answers: Record<string, VarkAnswer>;
  timeLeft: number;
  error: string | null;
}

const VarkTestFlow = () => {
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
  const [logs, setLogs] = useState<string[]>([]);

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
  }, [isAuthenticated, addLog]);

  // Submit all answers
  const submitAllAnswers = useCallback(async () => {
    const { test, answers } = testState;
    if (!test) return;

    try {
      addLog('📤 Submitting all answers...');
      setTestState(prev => ({ ...prev, step: 'submitting' }));

      const submission = {
        answers: Object.values(answers)
      };

      addLog(`📊 Submitting ${submission.answers.length} answers`);
      const response = await varkAPI.submitAnswers(test.id, submission);
      
      addLog('✅ Answers submitted successfully!');
      addLog(`📈 Response: ${JSON.stringify(response.data)}`);
      
      setTestState(prev => ({ ...prev, step: 'completed' }));
      
      // Redirect to results page with test ID after a short delay
      setTimeout(() => {
        window.location.href = `/results?testId=${test.id}`;
      }, 2000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit answers';
      addLog(`❌ Submission failed: ${errorMessage}`);
      setTestState(prev => ({ 
        ...prev, 
        step: 'error', 
        error: errorMessage 
      }));
    }
  }, [testState, addLog]);

  // Start the actual test
  const startTest = useCallback(() => {
    addLog('▶️ Starting test...');
    setTestState(prev => ({ ...prev, step: 'testing' }));
  }, [addLog]);

  // Handle answer submission for current question
  const submitCurrentAnswer = useCallback(() => {
    const { test, currentQuestionIndex } = testState;
    if (!test) return;

    const currentQuestion = test.questions[currentQuestionIndex];
    const answer: VarkAnswer = {
      question_id: currentQuestion.id,
      category_id: currentQuestion.category.id,
      point: Math.round((currentSliderValue / 100) * currentQuestion.max_weight) // Convert slider to points
    };

    setTestState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: answer
      }
    }));

    addLog(`📝 Answered question ${currentQuestionIndex + 1}: ${answer.point}/${currentQuestion.max_weight} points`);

    // Move to next question or finish
    if (currentQuestionIndex < test.questions.length - 1) {
      setTestState(prev => ({ 
        ...prev, 
        currentQuestionIndex: prev.currentQuestionIndex + 1 
      }));
      setCurrentSliderValue(50); // Reset slider
    } else {
      // All questions answered, ready to submit
      addLog('🏁 All questions answered, ready to submit!');
    }
  }, [testState, currentSliderValue, addLog]);

  // Go back to previous question
  const goToPreviousQuestion = useCallback(() => {
    if (testState.currentQuestionIndex > 0) {
      setTestState(prev => ({ 
        ...prev, 
        currentQuestionIndex: prev.currentQuestionIndex - 1 
      }));
      
      // Restore previous answer if exists
      const prevQuestion = testState.test!.questions[testState.currentQuestionIndex - 1];
      const prevAnswer = testState.answers[prevQuestion.id];
      if (prevAnswer) {
        const sliderValue = (prevAnswer.point / prevQuestion.max_weight) * 100;
        setCurrentSliderValue(sliderValue);
      }
    }
  }, [testState]);

  // Reset test
  const resetTest = useCallback(() => {
    setTestState({
      step: 'loading',
      questionSet: null,
      test: null,
      currentQuestionIndex: 0,
      answers: {},
      timeLeft: 0,
      error: null
    });
    setCurrentSliderValue(50);
    setLogs([]);
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (isAuthenticated) {
      initializeTest();
    }
  }, [isAuthenticated, initializeTest]);

  // Render current question
  const renderCurrentQuestion = () => {
    const { test, currentQuestionIndex } = testState;
    if (!test) return null;

    const currentQuestion = test.questions[currentQuestionIndex];
    const totalQuestions = test.questions.length;
    const hasAnswered = currentQuestion.id in testState.answers;
    const allAnswered = Object.keys(testState.answers).length === totalQuestions;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-sm font-medium text-blue-600">
              Category: {currentQuestion.category.name} ({currentQuestion.category.code})
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            {currentQuestion.body}
          </h3>
          <p className="text-sm text-gray-600">
            Max points: {currentQuestion.max_weight}
          </p>
        </div>

        {/* Slider */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span>Strongly Disagree</span>
            <span>Strongly Agree</span>
          </div>
          <div className="relative px-2">
            <input
              type="range"
              min="0"
              max="100"
              value={currentSliderValue}
              onChange={(e) => setCurrentSliderValue(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center text-xl font-bold mt-4 text-blue-600">
              {Math.round((currentSliderValue / 100) * currentQuestion.max_weight)} / {currentQuestion.max_weight}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {allAnswered ? (
            <button
              onClick={submitAllAnswers}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <CheckCircle className="w-4 h-4" />
              Submit Test
            </button>
          ) : (
            <button
              onClick={submitCurrentAnswer}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {currentQuestionIndex < totalQuestions - 1 ? 'Next' : 'Answer'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Answered indicator */}
        {hasAnswered && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Already answered with {testState.answers[currentQuestion.id].point} points</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">VARK Learning Style Test</h1>
          
          {/* User info */}
          {user && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Welcome, {user.name}!</span>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              testState.step === 'completed' ? 'bg-green-500' :
              testState.step === 'error' ? 'bg-red-500' :
              testState.step === 'testing' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`} />
            <span className="font-medium capitalize">{testState.step.replace('_', ' ')}</span>
            
            {testState.test && testState.step === 'testing' && (
              <div className="flex items-center gap-2 ml-auto">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Test ID: {testState.test.id.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {!isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Please login to start the VARK test</span>
            </div>
          </div>
        )}

        {testState.step === 'ready' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Ready to Start!</h2>
            <p className="text-gray-600 mb-4">
              You&apos;re about to take the VARK Learning Style Assessment with {testState.questionSet?.questions.length} questions.
            </p>
            <button
              onClick={startTest}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              Start Test
            </button>
          </div>
        )}

        {testState.step === 'testing' && renderCurrentQuestion()}

        {testState.step === 'submitting' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Submitting Your Answers...</h2>
            <p className="text-gray-600">Please wait while we process your responses.</p>
          </div>
        )}

        {testState.step === 'completed' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-green-700">Test Completed!</h2>
              <p className="text-gray-600 mb-6">
                Your VARK assessment has been submitted successfully. You can now view your results.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/results'}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                >
                  View Results
                </button>
                <button
                  onClick={resetTest}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                >
                  Take Another Test
                </button>
              </div>
            </div>
          </div>
        )}

        {testState.step === 'error' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-red-700">Error</h2>
              <p className="text-gray-600 mb-6">{testState.error}</p>
              <button
                onClick={resetTest}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Debug Logs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Debug Logs</h3>
          <div className="bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic">No logs yet...</p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-700">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VarkTestFlow;