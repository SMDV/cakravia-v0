"use client"

import React, { useState, useEffect, useRef } from 'react';
import { User, Check } from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  sender: "ai" | "user";
  type: "text" | "slider_answer";
  text?: string;
  sliderValue?: number;
}

const TestInterface = () => {
  const [timeLeft, setTimeLeft] = useState(2432);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSliderValue, setCurrentSliderValue] = useState(50);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Move questions outside component or use useMemo to prevent re-creation
  const dummyQuestions = React.useMemo(() => [
    {
      id: 1,
      text: "Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum"
    },
    {
      id: 2,
      text: "Pertanyaan nomor 2. Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum"
    },
    {
      id: 3,
      text: "Pertanyaan nomor 3. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam."
    },
    {
      id: 4,
      text: "Pertanyaan nomor 4. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores."
    },
    {
      id: 5,
      text: "Pertanyaan nomor 5. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit."
    }
  ], []);

  const totalQuestions = dummyQuestions.length;

  // Initialize chat with first question - now includes dummyQuestions in dependency
  useEffect(() => {
    if (dummyQuestions.length > 0 && chatHistory.length === 0) {
      setChatHistory([{ 
        sender: "ai", 
        type: "text", 
        text: dummyQuestions[0].text 
      }]);
    }
  }, [chatHistory.length, dummyQuestions]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          alert('Time is up! Exam submitted.');
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleNextQuestion = () => {
    // Add user's slider answer to chat history
    setChatHistory(prev => [...prev, { 
      sender: "user", 
      type: "slider_answer", 
      sliderValue: currentSliderValue 
    }]);

    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < totalQuestions) {
      // Add next question to chat history
      setChatHistory(prev => [...prev, { 
        sender: "ai", 
        type: "text", 
        text: dummyQuestions[nextIndex].text 
      }]);
      setCurrentQuestionIndex(nextIndex);
      setCurrentSliderValue(50); // Reset slider for next question
    } else {
      // All questions completed
      alert('Exam completed! Redirecting to results...');
      window.location.href = '/results';
    }
  };

  const SliderAnswer = ({ value }: { value: number }) => (
    <div className="w-full max-w-sm">
      <div className="flex justify-between text-xs text-white mb-2">
        <span>Sangat rendah</span>
        <span>Sangat tinggi</span>
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
        <span>Sangat rendah</span>
        <span>Sangat tinggi</span>
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
        .slider {
          background: linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%);
          transition: all 0.2s ease-in-out;
        }
        
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
        
        .slider::-webkit-slider-thumb:active {
          transform: scale(1.2);
        }
        
        .slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #2A3262;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 3px 8px rgba(42, 50, 98, 0.3);
          transition: all 0.2s ease-in-out;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(42, 50, 98, 0.4);
        }
        
        .slider::-moz-range-track {
          height: 12px;
          background: #e5e7eb;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#DFE4FF', fontFamily: 'Merriweather Sans, sans-serif' }}>
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-800 rounded mr-2"></div>
          <span className="font-bold text-lg">logoipsum</span>
        </div>
        <nav className="flex space-x-8">
          <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
          <Link href="/about" className="text-gray-700 hover:text-blue-600">About Us</Link>
          <Link href="/profile" className="text-gray-700 hover:text-blue-600">Login</Link>
        </nav>
      </header>

      <div className="flex justify-center py-8 px-6">
        <div className="w-full max-w-4xl">
          {/* Timer */}
          <div 
            className="text-center py-4 mb-6 rounded-lg text-white font-bold text-xl"
            style={{ backgroundColor: '#2A3262' }}
          >
            <div className="text-sm mb-1">Time left</div>
            <div className="text-2xl">{formatTime(timeLeft)}</div>
          </div>

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
          {currentQuestionIndex < totalQuestions && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-center">
                <SliderInput 
                  value={currentSliderValue}
                  onChange={setCurrentSliderValue}
                />
              </div>
            </div>
          )}

          {/* Progress and Controls */}
          <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: '#ABD305',
                    width: `${(currentQuestionIndex / totalQuestions) * 100}%`
                  }}
                />
              </div>
              <span className="text-sm font-medium" style={{ color: '#2A3262' }}>
                {currentQuestionIndex} out of {totalQuestions} answered
              </span>
            </div>
            
            <button 
              className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#2A3262' }}
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex >= totalQuestions}
            >
              {currentQuestionIndex >= totalQuestions - 1 ? 'Finish Exam' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInterface;