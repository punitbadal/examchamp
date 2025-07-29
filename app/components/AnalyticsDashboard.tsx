'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon,
  ClockIcon,
  StarIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  FireIcon,
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

interface PerformanceMetric {
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
  color: string;
  icon: any;
}

interface SubjectPerformance {
  subject: string;
  score: number;
  questionsAttempted: number;
  questionsCorrect: number;
  averageTime: number;
  strength: boolean;
}

interface QuestionTypePerformance {
  type: string;
  attempted: number;
  correct: number;
  accuracy: number;
  averageTime: number;
}

interface TimeAnalysis {
  fastQuestions: number;
  mediumQuestions: number;
  slowQuestions: number;
  averageTimePerQuestion: number;
  timeEfficiency: number;
}

interface AnalyticsData {
  overview: {
    totalExams: number;
    averageScore: number;
    bestScore: number;
    totalTime: number;
    passRate: number;
  };
  performanceMetrics: PerformanceMetric[];
  subjectPerformance: SubjectPerformance[];
  questionTypePerformance: QuestionTypePerformance[];
  timeAnalysis: TimeAnalysis;
  recentTrends: {
    date: string;
    score: number;
    exam: string;
  }[];
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

interface AnalyticsDashboardProps {
  studentId?: string;
  examId?: string;
  timeFrame?: 'week' | 'month' | 'quarter' | 'year' | 'all';
}

export default function AnalyticsDashboard({
  studentId,
  examId,
  timeFrame = 'month'
}: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(timeFrame);

  useEffect(() => {
    loadAnalytics();
  }, [studentId, examId, selectedTimeFrame]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, fetch from API
      const mockAnalytics: AnalyticsData = {
        overview: {
          totalExams: 12,
          averageScore: 78.5,
          bestScore: 92,
          totalTime: 1560,
          passRate: 83.3
        },
        performanceMetrics: [
          {
            label: 'Average Score',
            value: 78.5,
            previousValue: 72.3,
            unit: '%',
            trend: 'up',
            percentageChange: 8.6,
            color: 'green',
            icon: StarIcon
          },
          {
            label: 'Best Score',
            value: 92,
            previousValue: 89,
            unit: '%',
            trend: 'up',
            percentageChange: 3.4,
            color: 'blue',
            icon: TrophyIcon
          },
          {
            label: 'Pass Rate',
            value: 83.3,
            previousValue: 75.0,
            unit: '%',
            trend: 'up',
            percentageChange: 11.1,
            color: 'green',
            icon: CheckCircleIcon
          },
          {
            label: 'Avg Time',
            value: 130,
            previousValue: 145,
            unit: 'min',
            trend: 'down',
            percentageChange: -10.3,
            color: 'blue',
            icon: ClockIcon
          }
        ],
        subjectPerformance: [
          {
            subject: 'Physics',
            score: 82,
            questionsAttempted: 45,
            questionsCorrect: 37,
            averageTime: 2.5,
            strength: true
          },
          {
            subject: 'Chemistry',
            score: 76,
            questionsAttempted: 42,
            questionsCorrect: 32,
            averageTime: 2.8,
            strength: false
          },
          {
            subject: 'Mathematics',
            score: 85,
            questionsAttempted: 48,
            questionsCorrect: 41,
            averageTime: 2.2,
            strength: true
          }
        ],
        questionTypePerformance: [
          {
            type: 'MCQ Single',
            attempted: 120,
            correct: 98,
            accuracy: 81.7,
            averageTime: 1.8
          },
          {
            type: 'MCQ Multiple',
            attempted: 45,
            correct: 32,
            accuracy: 71.1,
            averageTime: 3.2
          },
          {
            type: 'Numerical',
            attempted: 60,
            correct: 48,
            accuracy: 80.0,
            averageTime: 4.5
          },
          {
            type: 'True/False',
            attempted: 30,
            correct: 26,
            accuracy: 86.7,
            averageTime: 1.2
          }
        ],
        timeAnalysis: {
          fastQuestions: 85,
          mediumQuestions: 45,
          slowQuestions: 20,
          averageTimePerQuestion: 2.3,
          timeEfficiency: 78.5
        },
        recentTrends: [
          { date: '2024-01-15', score: 85, exam: 'JEE Mock 1' },
          { date: '2024-01-10', score: 78, exam: 'Physics Test' },
          { date: '2024-01-05', score: 82, exam: 'Chemistry Quiz' },
          { date: '2024-01-01', score: 79, exam: 'Math Practice' }
        ],
        recommendations: [
          'Focus on Chemistry - your weakest subject',
          'Practice more MCQ Multiple questions',
          'Improve time management in numerical questions',
          'Review Physics formulas regularly'
        ],
        strengths: [
          'Strong performance in Mathematics',
          'Good accuracy in True/False questions',
          'Consistent improvement trend',
          'Efficient time management'
        ],
        weaknesses: [
          'Chemistry needs more practice',
          'MCQ Multiple questions accuracy low',
          'Numerical questions take too long',
          'Physics formulas need revision'
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'physics':
        return 'blue';
      case 'chemistry':
        return 'green';
      case 'mathematics':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics available</h3>
        <p className="text-gray-600">Complete some exams to see your performance analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Performance Analytics</h2>
              <p className="text-sm text-gray-600">Detailed insights into your exam performance</p>
            </div>
          </div>
          
          <select
            value={selectedTimeFrame}
            onChange={(e) => setSelectedTimeFrame(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.performanceMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metric.value}{metric.unit}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-${metric.color}-100`}>
                    <Icon className={`h-6 w-6 text-${metric.color}-600`} />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.percentageChange > 0 ? '+' : ''}{metric.percentageChange}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
        <div className="space-y-4">
          {analytics.subjectPerformance.map((subject, index) => (
            <motion.div
              key={subject.subject}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full bg-${getSubjectColor(subject.subject)}-500`}></div>
                <div>
                  <h4 className="font-medium text-gray-900">{subject.subject}</h4>
                  <p className="text-sm text-gray-500">
                    {subject.questionsCorrect}/{subject.questionsAttempted} correct
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{subject.score}%</p>
                  <p className="text-sm text-gray-500">Score</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{subject.averageTime} min</p>
                  <p className="text-xs text-gray-500">Avg time</p>
                </div>
                {subject.strength ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Question Type Performance */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Type Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.questionTypePerformance.map((type, index) => (
            <motion.div
              key={type.type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <h4 className="font-medium text-gray-900 mb-2">{type.type}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium">{type.accuracy}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Attempted:</span>
                  <span className="font-medium">{type.attempted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Time:</span>
                  <span className="font-medium">{type.averageTime} min</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Time Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Management Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Question Speed Distribution</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Fast Questions:</span>
                <span className="font-medium text-green-600">{analytics.timeAnalysis.fastQuestions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Medium Questions:</span>
                <span className="font-medium text-yellow-600">{analytics.timeAnalysis.mediumQuestions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Slow Questions:</span>
                <span className="font-medium text-red-600">{analytics.timeAnalysis.slowQuestions}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Efficiency Metrics</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Time/Question:</span>
                <span className="font-medium">{analytics.timeAnalysis.averageTimePerQuestion} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Time Efficiency:</span>
                <span className="font-medium">{analytics.timeAnalysis.timeEfficiency}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            Your Strengths
          </h3>
          <ul className="space-y-2">
            {analytics.strengths.map((strength, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-2 text-sm text-gray-700"
              >
                <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{strength}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {analytics.weaknesses.map((weakness, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-2 text-sm text-gray-700"
              >
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>{weakness}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <TagIcon className="h-5 w-5 text-blue-500 mr-2" />
          Personalized Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.recommendations.map((recommendation, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg"
            >
                              <TagIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">{recommendation}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 