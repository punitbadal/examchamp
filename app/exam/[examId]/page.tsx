'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FlagIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Question {
  id: string;
  questionText: string;
  questionType: 'mcq' | 'numerical' | 'matrix_match' | 'assertion_reason';
  options?: string[];
  correctAnswer: string | string[];
  marks: number;
  negativeMarks: number;
  explanation?: string;
  imageUrl?: string;
}

interface Exam {
  id: string;
  title: string;
  examCode: string;
  totalDuration: number; // in minutes
  totalMarks: number;
  sections: ExamSection[];
  instructions: string;
  negativeMarking: boolean;
  partialCredit: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
}

interface ExamSection {
  id: string;
  name: string;
  duration: number;
  totalMarks: number;
  questions: Question[];
  instructions: string;
}

interface Answer {
  questionId: string;
  answer: string | string[];
  isFlagged: boolean;
  timeSpent: number;
}

interface ProctoringAlert {
  id: string;
  type: 'tab_switch' | 'timeout' | 'violation';
  message: string;
  timestamp: Date;
  severity: 'warning' | 'error';
}

export default function LiveExam() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  
  // State management
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Proctoring state
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [alerts, setAlerts] = useState<ProctoringAlert[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  // UI state
  const [showInstructions, setShowInstructions] = useState(true);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activityRef = useRef<NodeJS.Timeout | null>(null);
  const fullScreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    loadExam();
    setupProctoring();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activityRef.current) clearTimeout(activityRef.current);
    };
  }, [examId, router]);

  const loadExam = async () => {
    try {
      // Mock exam data
      const mockExam: Exam = {
        id: examId,
        title: 'JEE Main Mock Test 1',
        examCode: 'JEE001',
        totalDuration: 180,
        totalMarks: 300,
        instructions: 'Read each question carefully. You have 3 hours to complete this exam. Negative marking applies.',
        negativeMarking: true,
        partialCredit: false,
        randomizeQuestions: false,
        randomizeOptions: false,
        sections: [
          {
            id: '1',
            name: 'Physics',
            duration: 60,
            totalMarks: 100,
            instructions: 'Physics section with 25 questions',
            questions: [
              {
                id: '1',
                questionText: 'A particle moves along a straight line with velocity v = 3t² - 6t + 2 m/s. The acceleration of the particle at t = 2s is:',
                questionType: 'mcq',
                options: ['6 m/s²', '8 m/s²', '10 m/s²', '12 m/s²'],
                correctAnswer: '6 m/s²',
                marks: 4,
                negativeMarks: 1
              },
              {
                id: '2',
                questionText: 'The value of ∫(x² + 2x + 1)dx from 0 to 2 is:',
                questionType: 'numerical',
                correctAnswer: '8',
                marks: 3,
                negativeMarks: 0
              },
              {
                id: '3',
                questionText: 'Match the following:\nColumn I: A) HCl B) H₂SO₄ C) HNO₃\nColumn II: 1) Monobasic 2) Dibasic 3) Tribasic',
                questionType: 'matrix_match',
                correctAnswer: ['A-1', 'B-2', 'C-1'],
                marks: 4,
                negativeMarks: 1
              }
            ]
          },
          {
            id: '2',
            name: 'Chemistry',
            duration: 60,
            totalMarks: 100,
            instructions: 'Chemistry section with 25 questions',
            questions: [
              {
                id: '4',
                questionText: 'What is the molecular formula of glucose?',
                questionType: 'mcq',
                options: ['C₆H₁₂O₆', 'C₆H₁₀O₅', 'C₅H₁₀O₅', 'C₆H₁₂O₅'],
                correctAnswer: 'C₆H₁₂O₆',
                marks: 4,
                negativeMarks: 1
              }
            ]
          }
        ]
      };

      setExam(mockExam);
      setTimeRemaining(mockExam.totalDuration * 60); // Convert to seconds
      setLoading(false);
    } catch (error) {
      console.error('Error loading exam:', error);
      setError('Failed to load exam');
      setLoading(false);
    }
  };

  const setupProctoring = () => {
    // Tab switching detection
    const handleVisibilityChange = () => {
      if (document.hidden && examStarted && !examSubmitted) {
        setTabSwitchCount(prev => prev + 1);
        addAlert('tab_switch', 'Tab switching detected', 'warning');
        setShowViolationModal(true);
      }
    };

    // Full screen detection
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    // Activity monitoring
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    // Setup event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('click', handleActivity);

    // Activity timeout
    const checkActivity = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      
      if (timeSinceActivity > 300000 && examStarted && !examSubmitted) { // 5 minutes
        addAlert('timeout', 'No activity detected for 5 minutes', 'warning');
      }
      
      activityRef.current = setTimeout(checkActivity, 60000); // Check every minute
    };
    
    checkActivity();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('click', handleActivity);
    };
  };

  const addAlert = (type: ProctoringAlert['type'], message: string, severity: 'warning' | 'error') => {
    const alert: ProctoringAlert = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      severity
    };
    setAlerts(prev => [...prev, alert]);
  };

  const startExam = () => {
    setExamStarted(true);
    setShowInstructions(false);
    startTimer();
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (answer: string | string[]) => {
    const currentQ = exam?.sections[currentSection]?.questions[currentQuestion];
    if (!currentQ) return;

    const existingAnswerIndex = answers.findIndex(a => a.questionId === currentQ.id);
    const newAnswer: Answer = {
      questionId: currentQ.id,
      answer,
      isFlagged: false,
      timeSpent: 0 // Will be calculated on submit
    };

    if (existingAnswerIndex >= 0) {
      setAnswers(prev => prev.map((a, i) => i === existingAnswerIndex ? newAnswer : a));
    } else {
      setAnswers(prev => [...prev, newAnswer]);
    }
  };

  const toggleFlag = () => {
    const currentQ = exam?.sections[currentSection]?.questions[currentQuestion];
    if (!currentQ) return;

    setAnswers(prev => prev.map(a => 
      a.questionId === currentQ.id 
        ? { ...a, isFlagged: !a.isFlagged }
        : a
    ));
  };

  const navigateQuestion = (direction: 'prev' | 'next') => {
    const currentSectionQuestions = exam?.sections[currentSection]?.questions || [];
    
    if (direction === 'next' && currentQuestion < currentSectionQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (direction === 'prev' && currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (direction === 'next' && currentSection < (exam?.sections.length || 0) - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    } else if (direction === 'prev' && currentSection > 0) {
      setCurrentSection(currentSection - 1);
      const prevSectionQuestions = exam?.sections[currentSection - 1]?.questions || [];
      setCurrentQuestion(prevSectionQuestions.length - 1);
    }
  };

  const submitExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamSubmitted(true);
    setShowConfirmSubmit(false);
    
    // Send results to backend
    console.log('Submitting exam with answers:', answers);
    
    // Redirect to results page
    setTimeout(() => {
      router.push(`/exam/${examId}/results`);
    }, 2000);
  };

  const requestFullScreen = () => {
    if (fullScreenRef.current) {
      fullScreenRef.current.requestFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Exam</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  const currentSectionData = exam.sections[currentSection];
  const currentQuestionData = currentSectionData?.questions[currentQuestion];
  const currentAnswer = answers.find(a => a.questionId === currentQuestionData?.id);

  return (
    <div className="min-h-screen bg-gray-50" ref={fullScreenRef}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">{exam.title}</span>
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

              {/* Proctoring Status */}
              {proctoringEnabled && (
                <div className="flex items-center space-x-2">
                  <ShieldExclamationIcon className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-gray-600">Proctoring Active</span>
                </div>
              )}

              {/* Full Screen Button */}
              <button
                onClick={requestFullScreen}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                {isFullScreen ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Instructions</h2>
                <p className="text-gray-600">Please read the instructions carefully before starting</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">General Instructions</h3>
                  <p className="text-blue-800 text-sm">{exam.instructions}</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Important Notes</h3>
                  <ul className="text-yellow-800 text-sm space-y-1">
                    <li>• Do not switch browser tabs or windows</li>
                    <li>• Keep your face visible to the camera</li>
                    <li>• Do not use external devices or materials</li>
                    <li>• Timer will auto-submit when time expires</li>
                    {exam.negativeMarking && <li>• Negative marking applies for wrong answers</li>}
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Exam Details</h3>
                  <div className="text-green-800 text-sm space-y-1">
                    <p>• Duration: {exam.totalDuration} minutes</p>
                    <p>• Total Marks: {exam.totalMarks}</p>
                    <p>• Sections: {exam.sections.length}</p>
                    <p>• Total Questions: {exam.sections.reduce((sum, s) => sum + s.questions.length, 0)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={startExam}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                >
                  Start Exam
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Violation Modal */}
      <AnimatePresence>
        {showViolationModal && (
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
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Proctoring Alert</h2>
                <p className="text-gray-600 mb-4">
                  Tab switching detected. This is a violation of exam rules.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Tab switches: {tabSwitchCount}
                </p>
                <button
                  onClick={() => setShowViolationModal(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Acknowledge
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Exam</h2>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to submit your exam? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmSubmit(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitExam}
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

      {/* Main Content */}
      {examStarted && !examSubmitted && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Question Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                {/* Section Header */}
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Section {currentSection + 1}: {currentSectionData?.name}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Question {currentQuestion + 1} of {currentSectionData?.questions.length}
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
                          {exam.negativeMarking && (
                            <span className="text-sm text-red-500">
                              -{currentQuestionData.negativeMarks} marks
                            </span>
                          )}
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
                    disabled={currentSection === 0 && currentQuestion === 0}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => navigateQuestion('next')}
                    disabled={currentSection === exam.sections.length - 1 && 
                             currentQuestion === currentSectionData?.questions.length - 1}
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
                      {exam.sections.map((section, sectionIndex) =>
                        section.questions.map((question, questionIndex) => {
                          const answer = answers.find(a => a.questionId === question.id);
                          const isCurrent = sectionIndex === currentSection && questionIndex === currentQuestion;
                          
                          return (
                            <button
                              key={question.id}
                              onClick={() => {
                                setCurrentSection(sectionIndex);
                                setCurrentQuestion(questionIndex);
                              }}
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
                              {questionIndex + 1}
                            </button>
                          );
                        })
                      )}
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
                        {exam.sections.reduce((sum, s) => sum + s.questions.length, 0) - answers.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
                >
                  Submit Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submitted State */}
      {examSubmitted && (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Submitted</h2>
            <p className="text-gray-600 mb-4">Your exam has been successfully submitted.</p>
            <p className="text-sm text-gray-500">Redirecting to results...</p>
          </div>
        </div>
      )}
    </div>
  );
} 