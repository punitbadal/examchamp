'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FlagIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface PracticeTest {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalQuestions: number;
  duration: number;
  totalMarks: number;
  instructions: string;
  questions: Question[];
}

interface Question {
  id: string;
  questionText: string;
  questionType: 'mcq' | 'numerical' | 'matrix_match' | 'assertion_reason';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  marks: number;
  topic: string;
  imageUrl?: string;
}

interface Answer {
  questionId: string;
  answer: string | string[];
  isFlagged: boolean;
  timeSpent: number;
  isCorrect?: boolean;
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  marks: number;
  obtainedMarks: number;
  explanation: string;
  topic: string;
}

export default function PracticeTest() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  
  // State management
  const [test, setTest] = useState<PracticeTest | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [showInstructions, setShowInstructions] = useState(true);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    loadPracticeTest();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testId, router]);

  const loadPracticeTest = async () => {
    try {
      // Mock practice test data
      const mockTest: PracticeTest = {
        id: testId,
        title: 'Physics - Mechanics Practice Test',
        subject: 'Physics',
        chapter: 'Mechanics',
        difficulty: 'medium',
        totalQuestions: 25,
        duration: 60,
        totalMarks: 100,
        instructions: 'This practice test covers fundamental concepts of mechanics. Read each question carefully and select the best answer. You can flag questions for review.',
        questions: [
          {
            id: '1',
            questionText: 'A particle moves along a straight line with velocity v = 3t² - 6t + 2 m/s. The acceleration of the particle at t = 2s is:',
            questionType: 'mcq',
            options: ['6 m/s²', '8 m/s²', '10 m/s²', '12 m/s²'],
            correctAnswer: '6 m/s²',
            explanation: 'Acceleration is the derivative of velocity. a = dv/dt = 6t - 6. At t = 2s, a = 6(2) - 6 = 6 m/s²',
            marks: 4,
            topic: 'Kinematics'
          },
          {
            id: '2',
            questionText: 'The value of ∫(x² + 2x + 1)dx from 0 to 2 is:',
            questionType: 'numerical',
            correctAnswer: '8',
            explanation: '∫(x² + 2x + 1)dx = (x³/3 + x² + x) from 0 to 2 = (8/3 + 4 + 2) - 0 = 8',
            marks: 3,
            topic: 'Calculus'
          },
          {
            id: '3',
            questionText: 'Match the following:\nColumn I: A) HCl B) H₂SO₄ C) HNO₃\nColumn II: 1) Monobasic 2) Dibasic 3) Tribasic',
            questionType: 'matrix_match',
            correctAnswer: ['A-1', 'B-2', 'C-1'],
            explanation: 'HCl is monobasic (1 H+), H₂SO₄ is dibasic (2 H+), HNO₃ is monobasic (1 H+)',
            marks: 4,
            topic: 'Chemistry'
          },
          {
            id: '4',
            questionText: 'Assertion: The acceleration due to gravity is maximum at the poles.\nReason: The Earth is an oblate spheroid with equatorial radius greater than polar radius.',
            questionType: 'assertion_reason',
            correctAnswer: 'Both A and R are true and R is the correct explanation of A',
            explanation: 'Both assertion and reason are true. The Earth is indeed an oblate spheroid, and this shape causes gravity to be maximum at poles.',
            marks: 4,
            topic: 'Gravitation'
          }
        ]
      };

      setTest(mockTest);
      setTimeRemaining(mockTest.duration * 60); // Convert to seconds
      setLoading(false);
    } catch (error) {
      console.error('Error loading practice test:', error);
      setError('Failed to load practice test');
      setLoading(false);
    }
  };

  const startTest = () => {
    setTestStarted(true);
    setShowInstructions(false);
    startTimeRef.current = Date.now();
    startTimer();
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };

  const resumeTest = () => {
    setIsPaused(false);
    startTimer();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (answer: string | string[]) => {
    const currentQ = test?.questions[currentQuestion];
    if (!currentQ) return;

    const existingAnswerIndex = answers.findIndex(a => a.questionId === currentQ.id);
    const newAnswer: Answer = {
      questionId: currentQ.id,
      answer,
      isFlagged: false,
      timeSpent: 0
    };

    if (existingAnswerIndex >= 0) {
      setAnswers(prev => prev.map((a, i) => i === existingAnswerIndex ? newAnswer : a));
    } else {
      setAnswers(prev => [...prev, newAnswer]);
    }
  };

  const toggleFlag = () => {
    const currentQ = test?.questions[currentQuestion];
    if (!currentQ) return;

    setAnswers(prev => prev.map(a => 
      a.questionId === currentQ.id 
        ? { ...a, isFlagged: !a.isFlagged }
        : a
    ));
  };

  const navigateQuestion = (direction: 'prev' | 'next') => {
    if (direction === 'next' && currentQuestion < (test?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (direction === 'prev' && currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTestCompleted(true);
    setShowConfirmSubmit(false);
    
    // Calculate results
    const results = calculateResults();
    setShowResults(true);
    
    // In a real app, you would save results to backend
    console.log('Practice test completed with results:', results);
  };

  const calculateResults = () => {
    if (!test) return null;

    let correctAnswers = 0;
    let totalMarks = 0;
    let obtainedMarks = 0;
    const questionResults: QuestionResult[] = [];

    test.questions.forEach((question, index) => {
      const answer = answers.find(a => a.questionId === question.id);
      const isCorrect = answer ? checkAnswer(answer.answer, question.correctAnswer) : false;
      
      if (isCorrect) {
        correctAnswers++;
        obtainedMarks += question.marks;
      }
      
      totalMarks += question.marks;
      
      questionResults.push({
        questionId: question.id,
        questionText: question.questionText,
        userAnswer: answer?.answer || '',
        correctAnswer: question.correctAnswer,
        isCorrect,
        marks: question.marks,
        obtainedMarks: isCorrect ? question.marks : 0,
        explanation: question.explanation,
        topic: question.topic
      });
    });

    return {
      totalQuestions: test.questions.length,
      correctAnswers,
      wrongAnswers: test.questions.length - correctAnswers,
      unattempted: test.questions.length - answers.length,
      totalMarks,
      obtainedMarks,
      percentage: Math.round((obtainedMarks / totalMarks) * 100),
      timeTaken: Math.floor((Date.now() - startTimeRef.current) / 1000),
      questionResults
    };
  };

  const checkAnswer = (userAnswer: string | string[], correctAnswer: string | string[]): boolean => {
    if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
      return JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort());
    }
    return userAnswer === correctAnswer;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading practice test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Test</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!test) return null;

  const currentQuestionData = test.questions[currentQuestion];
  const currentAnswer = answers.find(a => a.questionId === currentQuestionData?.id);
  const results = calculateResults();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Practice Test</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Timer */}
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-red-500" />
                <span className={`font-mono text-lg font-bold ${
                  timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Pause/Resume Button */}
              {testStarted && !testCompleted && (
                <button
                  onClick={isPaused ? resumeTest : pauseTest}
                  className="flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  {isPaused ? (
                    <>
                      <PlayIcon className="h-4 w-4" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <PauseIcon className="h-4 w-4" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6"
            >
              <div className="text-center mb-6">
                <DocumentTextIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Practice Test Instructions</h2>
                <p className="text-gray-600">Please read the instructions carefully before starting</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Test Information</h3>
                  <div className="text-blue-800 text-sm space-y-1">
                    <p>• Title: {test.title}</p>
                    <p>• Subject: {test.subject} - {test.chapter}</p>
                    <p>• Difficulty: {test.difficulty}</p>
                    <p>• Questions: {test.totalQuestions}</p>
                    <p>• Duration: {test.duration} minutes</p>
                    <p>• Total Marks: {test.totalMarks}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Instructions</h3>
                  <p className="text-yellow-800 text-sm">{test.instructions}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Features</h3>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Instant results after completion</li>
                    <li>• Detailed explanations for each question</li>
                    <li>• Performance analytics and recommendations</li>
                    <li>• Flag questions for review</li>
                    <li>• Pause and resume functionality</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={startTest}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                >
                  Start Practice Test
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Submit Modal */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            >
              <div className="text-center">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Test</h2>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to submit your practice test? You'll see instant results.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmSubmit(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitTest}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Modal */}
      <AnimatePresence>
        {showResults && results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="text-center mb-6">
                <ChartBarIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Practice Test Results</h2>
                <p className="text-gray-600">Here's your performance analysis</p>
              </div>

              {/* Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.percentage}%</div>
                  <div className="text-sm text-blue-600">Score</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.correctAnswers}/{results.totalQuestions}</div>
                  <div className="text-sm text-green-600">Correct</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{results.wrongAnswers}</div>
                  <div className="text-sm text-red-600">Wrong</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{results.unattempted}</div>
                  <div className="text-sm text-yellow-600">Unattempted</div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Question Analysis</h3>
                {results.questionResults.map((result, index) => (
                  <div key={result.questionId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {result.obtainedMarks}/{result.marks} marks
                        </div>
                      </div>
                    </div>
                    
                    <div className="prose max-w-none mb-3">
                      <p className="text-sm text-gray-900">{result.questionText}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Your Answer:</span>
                        <p className="text-gray-900 mt-1">
                          {Array.isArray(result.userAnswer) ? result.userAnswer.join(', ') : result.userAnswer || 'Not answered'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Correct Answer:</span>
                        <p className="text-gray-900 mt-1">
                          {Array.isArray(result.correctAnswer) ? result.correctAnswer.join(', ') : result.correctAnswer}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-900">Explanation:</span>
                      <p className="text-blue-800 text-sm mt-1">{result.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-6 space-x-3">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back to Dashboard
                </Link>
                <button
                  onClick={() => setShowResults(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Take Another Test
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {testStarted && !testCompleted && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Question Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                {/* Question Header */}
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {test.title}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Question {currentQuestion + 1} of {test.questions.length}
                  </p>
                </div>

                {/* Question */}
                {currentQuestionData && (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {currentQuestionData.questionType.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {currentQuestionData.marks} marks
                          </span>
                          <span className="text-sm text-gray-500">
                            Topic: {currentQuestionData.topic}
                          </span>
                        </div>
                        
                        <div className="prose max-w-none">
                          <p className="text-lg text-gray-900 whitespace-pre-line">
                            {currentQuestionData.questionText}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={toggleFlag}
                        className={`ml-4 p-2 rounded-full ${
                          currentAnswer?.isFlagged
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <FlagIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-3">
                      {currentQuestionData.questionType === 'mcq' && currentQuestionData.options && (
                        <div className="space-y-3">
                          {currentQuestionData.options.map((option, index) => (
                            <label key={index} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${currentQuestionData.id}`}
                                value={option}
                                checked={currentAnswer?.answer === option}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className="text-gray-900">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {currentQuestionData.questionType === 'numerical' && (
                        <div>
                          <input
                            type="number"
                            step="any"
                            placeholder="Enter your answer"
                            value={currentAnswer?.answer || ''}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}

                      {currentQuestionData.questionType === 'matrix_match' && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">Match the following:</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Column I</h4>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">A)</span>
                                  <span className="text-sm">HCl</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">B)</span>
                                  <span className="text-sm">H₂SO₄</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">C)</span>
                                  <span className="text-sm">HNO₃</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Column II</h4>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">1)</span>
                                  <span className="text-sm">Monobasic</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">2)</span>
                                  <span className="text-sm">Dibasic</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">3)</span>
                                  <span className="text-sm">Tribasic</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">Select matches:</p>
                            {['A', 'B', 'C'].map((col) => (
                              <select
                                key={col}
                                value={Array.isArray(currentAnswer?.answer) ? 
                                  currentAnswer.answer.find(a => a.startsWith(col))?.split('-')[1] || '' : ''}
                                onChange={(e) => {
                                  const newMatches = Array.isArray(currentAnswer?.answer) ? 
                                    currentAnswer.answer.filter(a => !a.startsWith(col)) : [];
                                  if (e.target.value) {
                                    newMatches.push(`${col}-${e.target.value}`);
                                  }
                                  handleAnswerChange(newMatches);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select match for {col}</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                              </select>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentQuestionData.questionType === 'assertion_reason' && (
                        <div className="space-y-3">
                          {[
                            'Both A and R are true and R is the correct explanation of A',
                            'Both A and R are true but R is not the correct explanation of A',
                            'A is true but R is false',
                            'A is false but R is true',
                            'Both A and R are false'
                          ].map((option, index) => (
                            <label key={index} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${currentQuestionData.id}`}
                                value={option}
                                checked={currentAnswer?.answer === option}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className="text-gray-900">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => navigateQuestion('prev')}
                    disabled={currentQuestion === 0}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Submit Test
                  </button>

                  <button
                    onClick={() => navigateQuestion('next')}
                    disabled={currentQuestion === test.questions.length - 1}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Question Palette */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Question Palette</h3>
                    <button
                      onClick={() => setShowQuestionPalette(!showQuestionPalette)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {showQuestionPalette ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  
                  {showQuestionPalette && (
                    <div className="grid grid-cols-5 gap-2">
                      {test.questions.map((question, index) => {
                        const answer = answers.find(a => a.questionId === question.id);
                        const isCurrent = index === currentQuestion;
                        
                        return (
                          <button
                            key={question.id}
                            onClick={() => setCurrentQuestion(index)}
                            className={`p-2 text-xs rounded ${
                              isCurrent
                                ? 'bg-blue-600 text-white'
                                : answer
                                ? answer.isFlagged
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                  : 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Answered</span>
                      <span className="font-medium">{answers.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Flagged</span>
                      <span className="font-medium">{answers.filter(a => a.isFlagged).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining</span>
                      <span className="font-medium">
                        {test.questions.length - answers.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 