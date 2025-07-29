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
  MinusIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChartPieIcon,
  ChartBarSquareIcon,
  SignalIcon,
  UsersIcon,
  BookOpenIcon,
  CpuChipIcon,
  LightBulbIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface PredictiveInsight {
  type: 'score_prediction' | 'risk_assessment' | 'performance_trend' | 'study_recommendation';
  title: string;
  description: string;
  confidence: number;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  recommendations: string[];
}

interface InstitutionalReport {
  id: string;
  title: string;
  type: 'batch_analysis' | 'subject_performance' | 'trend_analysis' | 'comparative_study';
  generatedAt: Date;
  data: any;
  summary: string;
  insights: string[];
  recommendations: string[];
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  filters: any;
  metrics: string[];
  groupBy: string;
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
  lastGenerated: Date;
  nextGeneration: Date;
  format: 'pdf' | 'excel' | 'csv';
}

interface AdvancedAnalyticsProps {
  examId?: string;
  institutionId?: string;
  timeFrame?: 'week' | 'month' | 'quarter' | 'year';
}

export default function AdvancedAnalytics({
  examId,
  institutionId,
  timeFrame = 'month'
}: AdvancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'predictive' | 'institutional' | 'custom' | 'insights'>('predictive');
  const [loading, setLoading] = useState(false);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [institutionalReports, setInstitutionalReports] = useState<InstitutionalReport[]>([]);
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(timeFrame);

  useEffect(() => {
    loadAnalytics();
  }, [examId, institutionId, selectedTimeFrame]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, fetch from API
      const mockPredictiveInsights: PredictiveInsight[] = [
        {
          type: 'score_prediction',
          title: 'Predicted Performance',
          description: 'Based on historical data and current study patterns',
          confidence: 85,
          value: 78,
          unit: '%',
          trend: 'up',
          recommendations: [
            'Focus on Chemistry chapters 3-5',
            'Practice more numerical problems',
            'Review Physics formulas regularly'
          ]
        },
        {
          type: 'risk_assessment',
          title: 'Risk Level',
          description: 'Probability of scoring below passing threshold',
          confidence: 92,
          value: 15,
          unit: '%',
          trend: 'down',
          recommendations: [
            'Continue current study pattern',
            'Maintain regular practice schedule',
            'Focus on weak areas identified'
          ]
        },
        {
          type: 'performance_trend',
          title: 'Improvement Trend',
          description: 'Expected improvement over next 30 days',
          confidence: 78,
          value: 12,
          unit: '%',
          trend: 'up',
          recommendations: [
            'Increase practice test frequency',
            'Focus on time management',
            'Review previous exam mistakes'
          ]
        },
        {
          type: 'study_recommendation',
          title: 'Study Priority',
          description: 'Recommended focus areas for maximum impact',
          confidence: 88,
          value: 3,
          unit: 'hours/day',
          trend: 'stable',
          recommendations: [
            'Allocate 2 hours to Chemistry',
            '1 hour for Physics practice',
            '30 minutes for formula revision'
          ]
        }
      ];

      const mockInstitutionalReports: InstitutionalReport[] = [
        {
          id: '1',
          title: 'Batch Performance Analysis - JEE 2024',
          type: 'batch_analysis',
          generatedAt: new Date(),
          data: {
            totalStudents: 150,
            averageScore: 72.5,
            passRate: 68.3,
            topPerformers: 23,
            improvementNeeded: 45
          },
          summary: 'Overall batch performance is above average with 68.3% pass rate',
          insights: [
            'Chemistry performance needs improvement',
            'Mathematics scores are consistently high',
            'Time management is a common issue'
          ],
          recommendations: [
            'Implement additional Chemistry coaching',
            'Focus on time management training',
            'Provide more practice tests'
          ]
        },
        {
          id: '2',
          title: 'Subject-wise Performance Report',
          type: 'subject_performance',
          generatedAt: new Date(),
          data: {
            physics: { average: 75.2, strength: 'strong' },
            chemistry: { average: 68.1, strength: 'weak' },
            mathematics: { average: 82.3, strength: 'strong' }
          },
          summary: 'Mathematics leads with 82.3% average, Chemistry needs attention',
          insights: [
            'Physics performance is consistent',
            'Chemistry shows significant variation',
            'Mathematics has highest correlation with overall score'
          ],
          recommendations: [
            'Increase Chemistry class hours',
            'Provide Chemistry practice materials',
            'Assign Chemistry mentors'
          ]
        }
      ];

      const mockCustomReports: CustomReport[] = [
        {
          id: '1',
          name: 'Weekly Performance Report',
          description: 'Weekly performance summary for all students',
          filters: { status: 'active', examType: 'mock' },
          metrics: ['score', 'time', 'accuracy', 'improvement'],
          groupBy: 'student',
          schedule: 'weekly',
          lastGenerated: new Date(),
          nextGeneration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          format: 'pdf'
        },
        {
          id: '2',
          name: 'Subject Analysis Report',
          description: 'Detailed subject-wise performance analysis',
          filters: { subjects: ['physics', 'chemistry', 'mathematics'] },
          metrics: ['average_score', 'pass_rate', 'difficulty_analysis'],
          groupBy: 'subject',
          schedule: 'monthly',
          lastGenerated: new Date(),
          nextGeneration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          format: 'excel'
        }
      ];

      setPredictiveInsights(mockPredictiveInsights);
      setInstitutionalReports(mockInstitutionalReports);
      setCustomReports(mockCustomReports);
    } catch (error) {
      console.error('Error loading advanced analytics:', error);
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'score_prediction':
        return <TagIcon className="h-5 w-5" />;
      case 'risk_assessment':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'performance_trend':
        return <ArrowTrendingUpIcon className="h-5 w-5" />;
      case 'study_recommendation':
        return <CpuChipIcon className="h-5 w-5" />;
      default:
        return <LightBulbIcon className="h-5 w-5" />;
    }
  };

  const renderPredictiveAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Predictive Analytics</h3>
        <select
          value={selectedTimeFrame}
          onChange={(e) => setSelectedTimeFrame(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictiveInsights.map((insight, index) => {
          const IconComponent = getInsightIcon(insight.type);
          return (
            <motion.div
              key={insight.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {IconComponent}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(insight.trend)}
                  <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                    {insight.confidence}% confidence
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  {insight.value}{insight.unit}
                </div>
                <div className="text-sm text-gray-500">
                  {insight.trend === 'up' ? 'Improving' : insight.trend === 'down' ? 'Declining' : 'Stable'}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Recommendations</h5>
                <ul className="space-y-1">
                  {insight.recommendations.map((rec, recIndex) => (
                    <li key={recIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderInstitutionalReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Institutional Reports</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span>Generate New Report</span>
        </button>
      </div>

      <div className="space-y-4">
        {institutionalReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{report.title}</h4>
                <p className="text-sm text-gray-500">
                  Generated: {report.generatedAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  View
                </button>
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {Object.entries(report.data).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {typeof value === 'object' && value !== null ? 
                      (value as any).average || value : value}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Summary</h5>
                <p className="text-sm text-gray-600">{report.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Key Insights</h5>
                  <ul className="space-y-1">
                    {report.insights.map((insight, insightIndex) => (
                      <li key={insightIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                        <LightBulbIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Recommendations</h5>
                  <ul className="space-y-1">
                    {report.recommendations.map((rec, recIndex) => (
                      <li key={recIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                        <TagIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderCustomReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Custom Reports</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <PlusIcon className="h-4 w-4" />
          <span>Create Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {customReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{report.name}</h4>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  Edit
                </button>
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  Run
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Schedule:</span>
                <span className="font-medium capitalize">{report.schedule}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium uppercase">{report.format}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Generated:</span>
                <span className="font-medium">{report.lastGenerated.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Next Generation:</span>
                <span className="font-medium">{report.nextGeneration.toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">Metrics</h5>
              <div className="flex flex-wrap gap-1">
                {report.metrics.map((metric, metricIndex) => (
                  <span
                    key={metricIndex}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Patterns</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Strong Mathematics Performance</p>
                  <p className="text-sm text-gray-600">Consistent high scores in math sections</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">+15%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Chemistry Needs Attention</p>
                  <p className="text-sm text-gray-600">Below average performance in chemistry</p>
                </div>
              </div>
              <span className="text-sm font-medium text-yellow-600">-8%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Improving Time Management</p>
                  <p className="text-sm text-gray-600">Better completion rates in recent tests</p>
                </div>
              </div>
              <span className="text-sm font-medium text-blue-600">+12%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Predictive Recommendations</h4>
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Study Focus Areas</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Organic Chemistry - 2 hours daily</li>
                <li>• Physics Formulas - 30 minutes daily</li>
                <li>• Math Practice - 1 hour daily</li>
              </ul>
            </div>

            <div className="p-3 bg-indigo-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Expected Outcomes</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 15% improvement in Chemistry</li>
                <li>• 5% improvement in overall score</li>
                <li>• Better time management skills</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CpuChipIcon className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Advanced Analytics</h2>
              <p className="text-sm text-gray-600">
                AI-powered insights, predictive analytics, and institutional reporting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'predictive', name: 'Predictive Analytics', icon: CpuChipIcon },
            { id: 'institutional', name: 'Institutional Reports', icon: ChartBarIcon },
            { id: 'custom', name: 'Custom Reports', icon: ChartBarIcon },
            { id: 'insights', name: 'AI Insights', icon: LightBulbIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'predictive' && renderPredictiveAnalytics()}
        {activeTab === 'institutional' && renderInstitutionalReports()}
        {activeTab === 'custom' && renderCustomReports()}
        {activeTab === 'insights' && renderInsights()}
      </div>
    </div>
  );
} 