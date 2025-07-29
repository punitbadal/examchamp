'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  AcademicCapIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface ExamResult {
  examId: string;
  examTitle: string;
  examCode: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  timeTaken: number;
  totalTime: number;
  sections: SectionResult[];
  proctoringAlerts: ProctoringAlert[];
  submittedAt: string;
  status: 'passed' | 'failed' | 'pending';
}

interface SectionResult {
  name: string;
  totalMarks: number;
  obtainedMarks: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  questions: QuestionResult[];
}

interface QuestionResult {
  id: string;
  questionText: string;
  questionType: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  marks: number;
  obtainedMarks: number;
  timeSpent: number;
  isFlagged: boolean;
}

interface ProctoringAlert {
  id: string;
  type: 'tab_switch' | 'timeout' | 'violation';
  message: string;
  timestamp: string;
  severity: 'warning' | 'error';
}

export default function ExamResults() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'proctoring'>('overview');
  const [selectedSection, setSelectedSection] = useState(0);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    loadResults();
  }, [examId, router]);

  const loadResults = async () => {
    try {
      // Mock result data
      const mockResult: ExamResult = {
        examId,
        examTitle: 'JEE Main Mock Test 1',
        examCode: 'JEE001',
        totalMarks: 300,
        obtainedMarks: 245,
        percentage: 81.67,
        timeTaken: 165, // minutes
        totalTime: 180,
        submittedAt: new Date().toISOString(),
        status: 'passed',
        sections: [
          {
            name: 'Physics',
            totalMarks: 100,
            obtainedMarks: 82,
            correctAnswers: 18,
            wrongAnswers: 5,
            unattempted: 2,
            questions: [
              {
                id: '1',
                questionText: 'A particle moves along a straight line with velocity v = 3t² - 6t + 2 m/s. The acceleration of the particle at t = 2s is:',
                questionType: 'mcq',
                userAnswer: '6 m/s²',
                correctAnswer: '6 m/s²',
                isCorrect: true,
                marks: 4,
                obtainedMarks: 4,
                timeSpent: 45,
                isFlagged: false
              },
              {
                id: '2',
                questionText: 'The value of ∫(x² + 2x + 1)dx from 0 to 2 is:',
                questionType: 'numerical',
                userAnswer: '8',
                correctAnswer: '8',
                isCorrect: true,
                marks: 3,
                obtainedMarks: 3,
                timeSpent: 60,
                isFlagged: true
              },
              {
                id: '3',
                questionText: 'Match the following:\nColumn I: A) HCl B) H₂SO₄ C) HNO₃\nColumn II: 1) Monobasic 2) Dibasic 3) Tribasic',
                questionType: 'matrix_match',
                userAnswer: ['A-1', 'B-2', 'C-1'],
                correctAnswer: ['A-1', 'B-2', 'C-1'],
                isCorrect: true,
                marks: 4,
                obtainedMarks: 4,
                timeSpent: 90,
                isFlagged: false
              }
            ]
          },
          {
            name: 'Chemistry',
            totalMarks: 100,
            obtainedMarks: 78,
            correctAnswers: 16,
            wrongAnswers: 7,
            unattempted: 2,
            questions: [
              {
                id: '4',
                questionText: 'What is the molecular formula of glucose?',
                questionType: 'mcq',
                userAnswer: 'C₆H₁₂O₆',
                correctAnswer: 'C₆H₁₂O₆',
                isCorrect: true,
                marks: 4,
                obtainedMarks: 4,
                timeSpent: 30,
                isFlagged: false
              }
            ]
          }
        ],
        proctoringAlerts: [
          {
            id: '1',
            type: 'tab_switch',
            message: 'Tab switching detected',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            severity: 'warning'
          },
          {
            id: '2',
            type: 'timeout',
            message: 'No activity detected for 5 minutes',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            severity: 'warning'
          }
        ]
      };

      setResult(mockResult);
      setLoading(false);
    } catch (error) {
      console.error('Error loading results:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const downloadResults = () => {
    // Mock download functionality
    console.log('Downloading results...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Not Found</h2>
          <p className="text-gray-600 mb-4">The exam results could not be loaded.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Exam Results</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <button
                onClick={downloadResults}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{result.examTitle}</h1>
          <p className="text-gray-600 mt-2">Exam Code: {result.examCode}</p>
        </div>

        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{result.percentage}%</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{result.obtainedMarks}/{result.totalMarks}</div>
              <div className="text-sm text-gray-600">Marks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{formatTime(result.timeTaken)}</div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(result.status)}`}>
                {result.status.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Status</div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'detailed', name: 'Detailed Analysis', icon: DocumentTextIcon },
                { id: 'proctoring', name: 'Proctoring Review', icon: ShieldExclamationIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Section Performance */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Performance</h3>
                    <div className="space-y-4">
                      {result.sections.map((section, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-900">{section.name}</h4>
                            <span className="text-sm font-medium text-gray-600">
                              {section.obtainedMarks}/{section.totalMarks}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(section.obtainedMarks / section.totalMarks) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>Correct: {section.correctAnswers}</span>
                            <span>Wrong: {section.wrongAnswers}</span>
                            <span>Unattempted: {section.unattempted}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Analysis */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Analysis</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Time Taken</span>
                        <span className="font-medium">{formatTime(result.timeTaken)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Time</span>
                        <span className="font-medium">{formatTime(result.totalTime)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Time Remaining</span>
                        <span className="font-medium">{formatTime(result.totalTime - result.timeTaken)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(result.timeTaken / result.totalTime) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Detailed Analysis Tab */}
            {activeTab === 'detailed' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
                  
                  {/* Section Selector */}
                  <div className="flex space-x-2 mb-6">
                    {result.sections.map((section, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSection(index)}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          selectedSection === index
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {section.name}
                      </button>
                    ))}
                  </div>

                  {/* Question Analysis */}
                  <div className="space-y-4">
                    {result.sections[selectedSection]?.questions.map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              question.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {question.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                            {question.isFlagged && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Flagged
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {question.obtainedMarks}/{question.marks} marks
                            </div>
                            <div className="text-xs text-gray-500">
                              {question.timeSpent}s
                            </div>
                          </div>
                        </div>
                        
                        <div className="prose max-w-none mb-3">
                          <p className="text-sm text-gray-900">{question.questionText}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Your Answer:</span>
                            <p className="text-gray-900 mt-1">
                              {Array.isArray(question.userAnswer) ? question.userAnswer.join(', ') : question.userAnswer}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Correct Answer:</span>
                            <p className="text-gray-900 mt-1">
                              {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Proctoring Review Tab */}
            {activeTab === 'proctoring' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Proctoring Review</h3>
                  
                  {result.proctoringAlerts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Violations Detected</h3>
                      <p className="text-gray-500">Your exam session was conducted without any proctoring violations.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {result.proctoringAlerts.map((alert) => (
                        <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                              <div>
                                <h4 className="font-medium text-gray-900">{alert.message}</h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(alert.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Proctoring Summary</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Tab switches: {result.proctoringAlerts.filter(a => a.type === 'tab_switch').length}</li>
                      <li>• Timeout warnings: {result.proctoringAlerts.filter(a => a.type === 'timeout').length}</li>
                      <li>• Total violations: {result.proctoringAlerts.length}</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 