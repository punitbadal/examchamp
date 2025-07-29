'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Eye, 
  EyeOff,
  Calculator,
  FileText,
  Highlighter,
  AlertTriangle,
  Shield,
  Monitor,
  Camera,
  Mic,
  Wifi,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Question {
  _id: string;
  questionNumber: number;
  questionText: string;
  questionType: 'MCQ_Single' | 'MCQ_Multiple' | 'TrueFalse' | 'Integer' | 'Numerical';
  options: string[];
  correctAnswer: any;
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
  imageUrl?: string;
  explanation?: string;
  tolerance?: number;
}

interface ExamInterfaceProps {
  examId: string;
  questions: Question[];
  duration: number; // in minutes
  onAnswerSubmit: (questionId: string, answer: any) => void;
  onMarkForReview: (questionId: string, marked: boolean) => void;
  onExamSubmit: () => void;
  proctoringEnabled: boolean;
}

const ExamInterface: React.FC<ExamInterfaceProps> = ({
  examId,
  questions,
  duration,
  onAnswerSubmit,
  onMarkForReview,
  onExamSubmit,
  proctoringEnabled
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // in seconds
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showHighlighter, setShowHighlighter] = useState(false);
  const [proctoringStatus, setProctoringStatus] = useState({
    webcam: false,
    microphone: false,
    screen: false,
    browser: true
  });
  const [suspiciousActivity, setSuspiciousActivity] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout>();
  const webcamRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Proctoring setup
  useEffect(() => {
    if (proctoringEnabled) {
      setupProctoring();
      setupActivityMonitoring();
    }
  }, [proctoringEnabled]);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const setupProctoring = async () => {
    try {
      // Request webcam and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
      }

      setProctoringStatus(prev => ({
        ...prev,
        webcam: true,
        microphone: true
      }));

      // Monitor webcam and microphone
      monitorMediaDevices();
    } catch (error) {
      console.error('Proctoring setup failed:', error);
      toast.error('Proctoring setup failed. Please allow camera and microphone access.');
    }
  };

  const monitorMediaDevices = () => {
    // Monitor for device changes
    navigator.mediaDevices.addEventListener('devicechange', () => {
      // Check if devices are still available
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const hasVideo = devices.some(device => device.kind === 'videoinput');
        const hasAudio = devices.some(device => device.kind === 'audioinput');
        
        setProctoringStatus(prev => ({
          ...prev,
          webcam: hasVideo,
          microphone: hasAudio
        }));

        if (!hasVideo || !hasAudio) {
          addSuspiciousActivity('Device disconnected');
        }
      });
    });
  };

  const setupActivityMonitoring = () => {
    // Monitor tab switching
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        addSuspiciousActivity('Tab switched');
      }
    });

    // Monitor copy-paste
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      addSuspiciousActivity('Copy attempt detected');
      toast.error('Copy-paste is not allowed during the exam');
    });

    document.addEventListener('paste', (e) => {
      e.preventDefault();
      addSuspiciousActivity('Paste attempt detected');
      toast.error('Copy-paste is not allowed during the exam');
    });

    // Monitor right-click
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      addSuspiciousActivity('Right-click detected');
      toast.error('Right-click is not allowed during the exam');
    });

    // Monitor keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const forbiddenKeys = ['F5', 'F11', 'F12', 'Ctrl+R', 'Ctrl+Shift+R', 'Ctrl+U', 'F12'];
      const keyCombo = e.key + (e.ctrlKey ? '+Ctrl' : '') + (e.shiftKey ? '+Shift' : '');
      
      if (forbiddenKeys.includes(keyCombo)) {
        e.preventDefault();
        addSuspiciousActivity(`Forbidden key combination: ${keyCombo}`);
        toast.error('This keyboard shortcut is not allowed during the exam');
      }
    });
  };

  const addSuspiciousActivity = (activity: string) => {
    setSuspiciousActivity(prev => [...prev, `${new Date().toLocaleTimeString()}: ${activity}`]);
    
    if (suspiciousActivity.length > 5) {
      setShowWarning(true);
      toast.error('Multiple suspicious activities detected. Your session may be terminated.');
    }
  };

  const handleAnswerChange = (answer: any) => {
    const questionId = currentQuestion._id;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setVisitedQuestions(prev => new Set([...prev, questionId]));
    onAnswerSubmit(questionId, answer);
  };

  const handleMarkForReview = () => {
    const questionId = currentQuestion._id;
    const isMarked = markedForReview.has(questionId);
    
    if (isMarked) {
      setMarkedForReview(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    } else {
      setMarkedForReview(prev => new Set([...prev, questionId]));
    }
    
    onMarkForReview(questionId, !isMarked);
  };

  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
    setVisitedQuestions(prev => new Set([...prev, questions[index]._id]));
  };

  const handleAutoSubmit = () => {
    toast.success('Time is up! Submitting exam automatically.');
    onExamSubmit();
  };

  const handleManualSubmit = () => {
    const unansweredCount = questions.filter(q => !answers[q._id]).length;
    
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }
    
    onExamSubmit();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId: string) => {
    if (markedForReview.has(questionId)) return 'marked';
    if (answers[questionId]) return 'answered';
    if (visitedQuestions.has(questionId)) return 'visited';
    return 'unvisited';
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const { questionType, options, correctAnswer } = currentQuestion;
    const currentAnswer = answers[currentQuestion._id];

    switch (questionType) {
      case 'MCQ_Single':
        return (
          <div className="space-y-4">
            {options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'MCQ_Multiple':
        return (
          <div className="space-y-4">
            {options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(currentAnswer) && currentAnswer.includes(option)}
                  onChange={(e) => {
                    const newAnswer = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                    if (e.target.checked) {
                      newAnswer.push(option);
                    } else {
                      const index = newAnswer.indexOf(option);
                      if (index > -1) newAnswer.splice(index, 1);
                    }
                    handleAnswerChange(newAnswer);
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'TrueFalse':
        return (
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={`question-${currentQuestion._id}`}
                value="true"
                checked={currentAnswer === true}
                onChange={() => handleAnswerChange(true)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">True</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={`question-${currentQuestion._id}`}
                value="false"
                checked={currentAnswer === false}
                onChange={() => handleAnswerChange(false)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">False</span>
            </label>
          </div>
        );

      case 'Integer':
        return (
          <div>
            <input
              type="number"
              min="0"
              step="1"
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your answer (integer only)"
            />
          </div>
        );

      case 'Numerical':
        return (
          <div>
            <input
              type="number"
              step="0.01"
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your answer (numerical value)"
            />
            {currentQuestion.tolerance && (
              <p className="text-sm text-gray-500 mt-1">
                Tolerance: ±{currentQuestion.tolerance}
              </p>
            )}
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">Exam</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Proctoring Status */}
              {proctoringEnabled && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${proctoringStatus.webcam ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Camera className="w-4 h-4" />
                  <div className={`w-2 h-2 rounded-full ${proctoringStatus.microphone ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Mic className="w-4 h-4" />
                  <div className={`w-2 h-2 rounded-full ${proctoringStatus.browser ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Shield className="w-4 h-4" />
                </div>
              )}
              
              {/* Timer */}
              <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-md">
                <Clock className="w-4 h-4 text-red-600" />
                <span className={`font-mono text-sm ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Question {currentQuestion.questionNumber}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {currentQuestion.questionType}
                  </span>
                  <span className="text-sm text-gray-500">
                    {currentQuestion.marksPerQuestion} marks
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleMarkForReview}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${
                      markedForReview.has(currentQuestion._id)
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    <span>Mark for Review</span>
                  </button>
                </div>
              </div>

              {/* Question Content */}
              <div className="mb-6">
                <div className="prose max-w-none">
                  <p className="text-gray-900 text-lg leading-relaxed">
                    {currentQuestion.questionText}
                  </p>
                  
                  {currentQuestion.imageUrl && (
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="max-w-full h-auto rounded-lg mt-4"
                    />
                  )}
                </div>
              </div>

              {/* Answer Options */}
              <div className="mb-6">
                {renderQuestion()}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Previous</span>
                </button>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                  </button>
                  
                  <button
                    onClick={handleManualSubmit}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Submit Exam
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Question Palette */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Palette</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(question._id);
                    return (
                      <button
                        key={question._id}
                        onClick={() => handleQuestionNavigation(index)}
                        className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                          index === currentQuestionIndex
                            ? 'bg-blue-600 text-white'
                            : status === 'answered'
                            ? 'bg-green-100 text-green-800'
                            : status === 'marked'
                            ? 'bg-yellow-100 text-yellow-800'
                            : status === 'visited'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-white border border-gray-300 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-100 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-100 rounded"></div>
                    <span>Visited</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                    <span>Not Visited</span>
                  </div>
                </div>
              </div>

              {/* Tools */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tools</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowCalculator(!showCalculator)}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Calculator</span>
                  </button>
                  
                  <button
                    onClick={() => setShowScratchpad(!showScratchpad)}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Scratchpad</span>
                  </button>
                  
                  <button
                    onClick={() => setShowHighlighter(!showHighlighter)}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                  >
                    <Highlighter className="w-4 h-4" />
                    <span>Highlighter</span>
                  </button>
                </div>
              </div>

              {/* Proctoring Status */}
              {proctoringEnabled && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Proctoring Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Webcam</span>
                      <div className={`flex items-center space-x-1 ${proctoringStatus.webcam ? 'text-green-600' : 'text-red-600'}`}>
                        {proctoringStatus.webcam ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span className="text-xs">{proctoringStatus.webcam ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Microphone</span>
                      <div className={`flex items-center space-x-1 ${proctoringStatus.microphone ? 'text-green-600' : 'text-red-600'}`}>
                        {proctoringStatus.microphone ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span className="text-xs">{proctoringStatus.microphone ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Browser Security</span>
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden webcam for proctoring */}
      {proctoringEnabled && (
        <video
          ref={webcamRef}
          autoPlay
          muted
          className="hidden"
          style={{ width: '1px', height: '1px' }}
        />
      )}

      {/* Tools Overlays */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCalculator(false)}
          >
            <div className="bg-white rounded-lg p-6 w-80" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Calculator</h3>
              <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-right">
                0
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map(btn => (
                  <button
                    key={btn}
                    className="p-3 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {showScratchpad && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowScratchpad(false)}
          >
            <div className="bg-white rounded-lg p-6 w-96 h-96" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Scratchpad</h3>
              <textarea
                className="w-full h-64 border border-gray-300 rounded p-3 resize-none"
                placeholder="Use this space for calculations and notes..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-600">Warning</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Multiple suspicious activities have been detected. Your exam session may be terminated if this continues.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowWarning(false)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamInterface; 