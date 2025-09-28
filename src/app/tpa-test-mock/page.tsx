"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  Check,
  Clock,
  ZoomIn,
  X,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';

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

// Mock TPA question data
const MOCK_TPA_QUESTIONS = [
  {
    id: "q1",
    question_text: "Look at the pattern below. Which option completes the sequence?",
    question_image_url: "https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Pattern+Sequence",
    option_a: "Triangle pointing up",
    option_b: "Circle with dot",
    option_c: "Square rotated 45°",
    option_d: "Diamond shape",
    option_e: "Hexagon pattern",
    category: "Spatial Reasoning",
    difficulty_level: 2
  },
  {
    id: "q2",
    question_text: "Read the following scenario and choose the best course of action. You are managing a team project with a tight deadline.",
    question_image_url: "https://via.placeholder.com/400x200/059669/FFFFFF?text=Project+Management+Scenario",
    option_a: "Prioritize immediate task completion by working overtime. Focus all team members on the most critical deliverables first. Communicate regularly with stakeholders about progress updates. Delegate responsibilities based on each team member's strengths and expertise. Ensure quality standards are maintained despite the time pressure.",
    option_b: "Request a deadline extension from the client or management. Explain the current challenges and resource constraints affecting the project timeline. Provide a realistic revised schedule with achievable milestones. Negotiate scope adjustments if necessary to meet quality expectations. Document all changes and get formal approval before proceeding.",
    option_c: "Divide the team into smaller specialized groups to work in parallel. Assign specific tasks to each group based on their skills and experience. Implement daily standup meetings to track progress and identify blockers. Use project management tools to coordinate between groups. Maintain clear communication channels to prevent duplicated efforts.",
    option_d: "Reduce the project scope by eliminating non-essential features or requirements. Focus on delivering the core functionality that provides the most value. Get stakeholder approval for the reduced scope and adjusted expectations. Allocate saved time to thorough testing and quality assurance. Plan to implement remaining features in future iterations.",
    option_e: "Bring in additional temporary resources or external consultants to help meet the deadline. Assess the budget implications of hiring extra help. Quickly onboard new team members with proper documentation and training. Assign experienced team members to mentor and guide the new additions. Monitor the cost-benefit ratio of this approach.",
    category: "Analytical Reasoning",
    difficulty_level: 3
  },
  {
    id: "q3",
    question_text: "A train travels 240 km in 3 hours. At this rate, how far will it travel in 5 hours?",
    option_a: "360 km",
    option_b: "400 km",
    option_c: "420 km",
    option_d: "450 km",
    option_e: "480 km",
    category: "Quantitative Reasoning",
    difficulty_level: 1
  },
  {
    id: "q4",
    question_text: "Choose the word that best completes the analogy: BOOK is to LIBRARY as PAINTING is to ___",
    option_a: "Frame",
    option_b: "Artist",
    option_c: "Gallery",
    option_d: "Canvas",
    option_e: "Color",
    category: "Verbal Reasoning",
    difficulty_level: 2
  }
];

/**
 * TPA Test Mock Interface Component
 * Provides a mock UI for testing TPA visual reasoning interface
 */
const TpaTestMockInterface = () => {
  const { } = useAuth();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSelectedOption, setCurrentSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // State for mobile answer panel visibility
  const [showAnswerPanel, setShowAnswerPanel] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize with first question
  useEffect(() => {
    if (chatHistory.length === 0) {
      const firstQuestion = MOCK_TPA_QUESTIONS[0];
      setChatHistory([{
        sender: "ai",
        type: "text",
        text: firstQuestion.question_text,
        questionId: firstQuestion.id,
        questionImageUrl: firstQuestion.question_image_url
      }]);
    }
  }, [chatHistory.length]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isCompleted]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }, []);

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    if (!currentSelectedOption) return;

    const currentQuestion = MOCK_TPA_QUESTIONS[currentQuestionIndex];

    // Add user's answer to chat
    setChatHistory(prev => [...prev, {
      sender: "user",
      type: "multiple_choice_answer",
      selectedOption: currentSelectedOption,
      questionId: currentQuestion.id
    }]);

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < MOCK_TPA_QUESTIONS.length) {
      // Add next question
      const nextQuestion = MOCK_TPA_QUESTIONS[nextIndex];
      setChatHistory(prev => [...prev, {
        sender: "ai",
        type: "text",
        text: nextQuestion.question_text,
        questionId: nextQuestion.id,
        questionImageUrl: nextQuestion.question_image_url
      }]);

      setCurrentQuestionIndex(nextIndex);
      setCurrentSelectedOption(null);
    } else {
      // Test completed
      setIsCompleted(true);
      setChatHistory(prev => [...prev, {
        sender: "ai",
        type: "text",
        text: "🎉 Congratulations! You have completed the TPA Assessment Mock. Click below to see your results!"
      }]);
    }
  }, [currentSelectedOption, currentQuestionIndex]);

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
    const question = MOCK_TPA_QUESTIONS.find(q => q.id === questionId);
    const optionText = question ? question[`option_${option.toLowerCase()}` as keyof typeof question] as string : `Option ${option}`;

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
  }, []);

  // MultipleChoiceInput Component for user input
  const MultipleChoiceInput = useCallback(({ value, onChange }: {
    value: 'A' | 'B' | 'C' | 'D' | 'E' | null;
    onChange: (value: 'A' | 'B' | 'C' | 'D' | 'E') => void
  }) => {
    const currentQuestion = MOCK_TPA_QUESTIONS[currentQuestionIndex];
    if (!currentQuestion) return null;

    const options: Array<{key: 'A' | 'B' | 'C' | 'D' | 'E', text: string}> = [
      { key: 'A', text: currentQuestion.option_a },
      { key: 'B', text: currentQuestion.option_b },
      { key: 'C', text: currentQuestion.option_c },
      { key: 'D', text: currentQuestion.option_d },
      { key: 'E', text: currentQuestion.option_e }
    ];

    return (
      <div className="w-full p-2 sm:p-4">
        <div className="text-center mb-2 sm:mb-4">
          <h4 className="text-sm sm:text-lg font-semibold" style={{ color: '#2A3262' }}>
            Choose your answer:
          </h4>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">
            Category: {currentQuestion.category}
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {options.map(({ key, text }) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`w-full p-2 sm:p-3 text-left rounded-lg border-2 transition-all duration-200 ${
                value === key
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                  value === key
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-400 text-gray-600'
                }`}>
                  {key}
                </div>
                <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                  {text}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }, [currentQuestionIndex]);

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
                    className="w-full h-auto max-h-64 sm:max-h-80 object-contain bg-white"
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

  return (
    <div className="h-screen flex flex-col overflow-hidden relative" style={{ fontFamily: 'Merriweather Sans, sans-serif' }}>
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
        <Header currentPage="tpa-test-mock" transparent />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col px-4 sm:px-6 py-4 max-w-7xl mx-auto w-full min-h-0">
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
                  {isCompleted ? 'Completed' : 'Testing (Mock)'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>
                  {Math.min(currentQuestionIndex + 1, MOCK_TPA_QUESTIONS.length)}/{MOCK_TPA_QUESTIONS.length}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop: Original 3-bar layout */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-4">
            {/* Status */}
            <div
              className="text-center py-4 rounded-lg text-white font-bold text-lg"
              style={{ backgroundColor: '#2A3262' }}
            >
              <div className="text-sm mb-1">Status</div>
              <div className="capitalize text-base">
                {isCompleted ? 'Completed' : 'Testing (Mock)'}
              </div>
            </div>

            {/* Timer */}
            <div
              className="text-center py-4 rounded-lg text-white font-bold text-lg"
              style={{ backgroundColor: '#2A3262' }}
            >
              <div className="text-sm mb-1 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                Time left
              </div>
              <div className="text-2xl">{formatTime(timeLeft)}</div>
            </div>

            {/* Question Counter */}
            <div
              className="text-center py-4 rounded-lg text-white font-bold text-lg"
              style={{ backgroundColor: '#2A3262' }}
            >
              <div className="text-sm mb-1">Progress</div>
              <div className="text-2xl">
                {Math.min(currentQuestionIndex + 1, MOCK_TPA_QUESTIONS.length)}/{MOCK_TPA_QUESTIONS.length}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Mobile: Full Question, Desktop: Left-Right */}
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
            {!isCompleted && (
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
                            width: `${((currentQuestionIndex + 1) / MOCK_TPA_QUESTIONS.length) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-center" style={{ color: '#2A3262' }}>
                        {currentQuestionIndex + 1} out of {MOCK_TPA_QUESTIONS.length} answered
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
                      {currentQuestionIndex >= MOCK_TPA_QUESTIONS.length - 1 ? 'Finish Assessment' : 'Next Question'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Floating Submit/Next Button */}
        {!isCompleted && (
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
                  {currentQuestionIndex >= MOCK_TPA_QUESTIONS.length - 1 ? 'Submit' : 'Next'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Mobile: Smart Choice Status Bar */}
        {!isCompleted && (
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
                            const currentQuestion = MOCK_TPA_QUESTIONS[currentQuestionIndex];
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
                          {MOCK_TPA_QUESTIONS[currentQuestionIndex]?.category || 'Multiple choice question'}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress and Toggle Indicator */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-600">
                      {currentQuestionIndex + 1}/{MOCK_TPA_QUESTIONS.length}
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: '#ABD305',
                          width: `${((currentQuestionIndex + 1) / MOCK_TPA_QUESTIONS.length) * 100}%`
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
        {!isCompleted && showAnswerPanel && (
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

        {/* Completion Section */}
        {isCompleted && (
          <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 text-center">
            <Check className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-green-700">TPA Mock Assessment Completed!</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              You&apos;ve completed the TPA assessment mock. Click below to see the mock results page.
            </p>
            <Link
              href="/tpa-test-results-mock"
              className="inline-block px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm sm:text-base"
            >
              View Mock Results
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TpaTestMockInterface;