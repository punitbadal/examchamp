'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  SunIcon, 
  GlobeAltIcon, 
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: 'mcq_single' | 'mcq_multiple' | 'numerical' | 'matrix_match';
  options?: string[];
  correctAnswer?: string | string[];
  marks: number;
  negativeMarks: number;
  subject: string;
  section: string;
}

interface ExamSection {
  name: string;
  questions: Question[];
  totalQuestions: number;
  totalMarks: number;
}

interface ExamInterfaceProps {
  examData: {
    title: string;
    sections: ExamSection[];
    totalDuration: number;
    totalMarks: number;
  };
  onAnswerChange: (questionId: string, answer: string | string[]) => void;
  onSubmit: () => void;
}

type QuestionStatus = 'not_seen' | 'seen' | 'attempted' | 'marked' | 'attempted_marked';

interface QuestionState {
  [key: string]: {
    status: QuestionStatus;
    answer: string | string[];
    timeSpent: number;
  };
}

const ExamInterface: React.FC<ExamInterfaceProps> = ({
  examData,
  onAnswerChange,
  onSubmit
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<QuestionState>({});
  const [timeRemaining, setTimeRemaining] = useState(examData.totalDuration * 60);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const currentSection = examData.sections[currentSectionIndex];
  const currentQuestion = currentSection.questions[currentQuestionIndex];
  const currentQuestionState = questionStates[currentQuestion.id] || {
    status: 'seen' as QuestionStatus,
    answer: '',
    timeSpent: 0
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onSubmit]);

  // Update question state when current question changes
  useEffect(() => {
    if (currentQuestion) {
      setQuestionStates(prev => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          status: 'seen' as QuestionStatus
        }
      }));
    }
  }, [currentQuestion]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (answer: string | string[]) => {
    const newState = {
      ...currentQuestionState,
      answer,
      status: 'attempted' as QuestionStatus
    };
    
    setQuestionStates(prev => ({
      ...prev,
      [currentQuestion.id]: newState
    }));
    
    onAnswerChange(currentQuestion.id, answer);
  };

  const handleMarkForReview = () => {
    setQuestionStates(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        status: currentQuestionState.status === 'attempted' ? 'attempted_marked' : 'marked'
      }
    }));
  };

  const handleClearResponse = () => {
    setQuestionStates(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        answer: '',
        status: 'seen'
      }
    }));
    onAnswerChange(currentQuestion.id, '');
  };

  const handleQuestionNavigation = (sectionIndex: number, questionIndex: number) => {
    setCurrentSectionIndex(sectionIndex);
    setCurrentQuestionIndex(questionIndex);
  };

  const getQuestionStatus = (questionId: string): QuestionStatus => {
    return questionStates[questionId]?.status || 'not_seen';
  };

  const getStatusCounts = (section: ExamSection) => {
    const counts = {
      attempted: 0,
      attempted_marked: 0,
      marked: 0,
      seen: 0,
      not_seen: 0
    };

    section.questions.forEach(question => {
      const status = getQuestionStatus(question.id);
      counts[status]++;
    });

    return counts;
  };

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'attempted': return 'bg-green-500';
      case 'attempted_marked': return 'bg-purple-500';
      case 'marked': return 'bg-purple-400';
      case 'seen': return 'bg-red-400';
      case 'not_seen': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    return (
      <div className="space-y-6">
        {/* Question Header */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>00:36</span>
            <span>|</span>
            <span>+{currentQuestion.marks} -{currentQuestion.negativeMarks}</span>
          </div>
        </div>

        {/* Question Number and Type */}
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            {currentQuestion.questionNumber}
          </div>
          <div className="text-sm text-gray-600">
            {currentQuestion.questionType === 'mcq_single' ? 'MCQ Single Answer' : 
             currentQuestion.questionType === 'mcq_multiple' ? 'MCQ Multiple Answer' :
             currentQuestion.questionType === 'numerical' ? 'Numerical' : 'Matrix Match'}
          </div>
        </div>

        {/* Question Text */}
        <div className="text-lg leading-relaxed">
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }} />
          </div>
        </div>

        {/* Options */}
        {currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  currentQuestionState.answer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type={currentQuestion.questionType === 'mcq_multiple' ? 'checkbox' : 'radio'}
                  name={`question-${currentQuestion.id}`}
                  value={option}
                  checked={
                    currentQuestion.questionType === 'mcq_multiple'
                      ? Array.isArray(currentQuestionState.answer) && currentQuestionState.answer.includes(option)
                      : currentQuestionState.answer === option
                  }
                  onChange={(e) => {
                    if (currentQuestion.questionType === 'mcq_multiple') {
                      const currentAnswers = Array.isArray(currentQuestionState.answer) ? currentQuestionState.answer : [];
                      const newAnswers = e.target.checked
                        ? [...currentAnswers, option]
                        : currentAnswers.filter(ans => ans !== option);
                      handleAnswerChange(newAnswers);
                    } else {
                      handleAnswerChange(option);
                    }
                  }}
                  className="mt-1"
                />
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1">
                    <div dangerouslySetInnerHTML={{ __html: option }} />
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Numerical Input */}
        {currentQuestion.questionType === 'numerical' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Enter your answer:
            </label>
            <input
              type="number"
              value={currentQuestionState.answer || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter numerical value"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">{examData.title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <SunIcon className="w-5 h-5" />
              <GlobeAltIcon className="w-5 h-5" />
              <Bars3Icon className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          {examData.sections.map((section, index) => (
            <button
              key={index}
              onClick={() => setCurrentSectionIndex(index)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                index === currentSectionIndex
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)]">
        {/* Left Panel - Question Area */}
        <div className="flex-1 bg-white p-6 overflow-y-auto">
          {renderQuestionContent()}
        </div>

        {/* Right Panel - Question Palette */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Status Legend */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Question Status</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Attempted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Attempted & Marked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span>Marked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>Seen</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span>Not Seen</span>
                </div>
              </div>
            </div>

            {/* Section Summaries */}
            {examData.sections.map((section, sectionIndex) => {
              const counts = getStatusCounts(section);
              return (
                <div key={sectionIndex} className="bg-white rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{section.name}</h3>
                  <div className="text-xs text-gray-600 mb-3">
                    {counts.attempted} Attempted, {counts.attempted_marked} Attempted & Marked, {counts.marked} Marked, {counts.seen} Seen, {counts.not_seen} Not Seen
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {section.questions.map((question, questionIndex) => (
                      <button
                        key={question.id}
                        onClick={() => handleQuestionNavigation(sectionIndex, questionIndex)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                          sectionIndex === currentSectionIndex && questionIndex === currentQuestionIndex
                            ? 'ring-2 ring-blue-500'
                            : ''
                        } ${getStatusColor(getQuestionStatus(question.id))} ${
                          getQuestionStatus(question.id) === 'attempted' || 
                          getQuestionStatus(question.id) === 'attempted_marked'
                            ? 'text-white'
                            : 'text-gray-700'
                        }`}
                      >
                        {question.questionNumber}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleClearResponse}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Clear Response
            </button>
            <button
              onClick={handleMarkForReview}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Mark for Review
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                } else if (currentSectionIndex > 0) {
                  setCurrentSectionIndex(currentSectionIndex - 1);
                  setCurrentQuestionIndex(examData.sections[currentSectionIndex - 1].questions.length - 1);
                }
              }}
              disabled={currentQuestionIndex === 0 && currentSectionIndex === 0}
              className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => {
                if (currentQuestionIndex < currentSection.questions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else if (currentSectionIndex < examData.sections.length - 1) {
                  setCurrentSectionIndex(currentSectionIndex + 1);
                  setCurrentQuestionIndex(0);
                }
              }}
              disabled={currentQuestionIndex === currentSection.questions.length - 1 && currentSectionIndex === examData.sections.length - 1}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Confirm Submission</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your exam? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  onSubmit();
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamInterface; 