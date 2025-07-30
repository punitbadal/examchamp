'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  AcademicCapIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface AnalyticsData {
  totalExams: number;
  totalUsers: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  recentExams: any[];
  topPerformers: any[];
  subjectPerformance: any[];
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalExams: 0,
    totalUsers: 0,
    totalAttempts: 0,
    averageScore: 0,
    passRate: 0,
    recentExams: [],
    topPerformers: [],
    subjectPerformance: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch real analytics data from multiple endpoints
      const [analyticsResponse, examsResponse, usersResponse, resultsResponse] = await Promise.all([
        fetch('/api/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/exams', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/results', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (analyticsResponse.ok && examsResponse.ok && usersResponse.ok && resultsResponse.ok) {
        const [analyticsData, examsData, usersData, resultsData] = await Promise.all([
          analyticsResponse.json(),
          examsResponse.json(),
          usersResponse.json(),
          resultsResponse.json()
        ]);

        // Process real data
        const processedData: AnalyticsData = {
          totalExams: examsData.data?.docs?.length || 0,
          totalUsers: usersData.data?.docs?.length || 0,
          totalAttempts: resultsData.data?.docs?.length || 0,
          averageScore: analyticsData.averageScore || 0,
          passRate: analyticsData.passRate || 0,
          recentExams: analyticsData.recentExams || [],
          topPerformers: analyticsData.topPerformers || [],
          subjectPerformance: analyticsData.subjectPerformance || []
        };

        setAnalyticsData(processedData);
      } else {
        console.error('Failed to fetch analytics data');
        // Fallback to mock data if API fails
        const mockData: AnalyticsData = {
          totalExams: 24,
          totalUsers: 1247,
          totalAttempts: 3456,
          averageScore: 78.5,
          passRate: 82.3,
          recentExams: [
            { id: '1', title: 'JEE Main Mock Test 1', attempts: 156, avgScore: 75.2, status: 'completed' },
            { id: '2', title: 'NEET Practice Test', attempts: 89, avgScore: 82.1, status: 'active' },
            { id: '3', title: 'GATE Computer Science', attempts: 234, avgScore: 68.9, status: 'completed' }
          ],
          topPerformers: [
            { id: '1', name: 'Rahul Sharma', score: 95.2, exam: 'JEE Main Mock Test 1' },
            { id: '2', name: 'Priya Patel', score: 93.8, exam: 'NEET Practice Test' },
            { id: '3', name: 'Amit Kumar', score: 91.5, exam: 'GATE Computer Science' }
          ],
          subjectPerformance: [
            { subject: 'Mathematics', avgScore: 82.3, totalQuestions: 450 },
            { subject: 'Physics', avgScore: 75.8, totalQuestions: 380 },
            { subject: 'Chemistry', avgScore: 79.2, totalQuestions: 420 },
            { subject: 'Biology', avgScore: 84.1, totalQuestions: 320 }
          ]
        };
        setAnalyticsData(mockData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalExams}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalUsers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UsersIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Attempts</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalAttempts}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.averageScore}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <StarIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
          <div className="space-y-4">
            {analyticsData.subjectPerformance.map((subject, index) => (
              <div key={subject.subject} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                  <span className="text-sm font-semibold text-gray-900">{subject.avgScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${subject.avgScore}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">{subject.totalQuestions} questions</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Exams</h3>
          <div className="space-y-4">
            {analyticsData.recentExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{exam.title}</p>
                  <p className="text-sm text-gray-600">{exam.attempts} attempts</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{exam.avgScore}%</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    exam.status === 'active' ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100'
                  }`}>
                    {exam.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
        <div className="space-y-4">
          {analyticsData.topPerformers.map((performer, index) => (
            <div key={performer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{performer.name}</p>
                  <p className="text-sm text-gray-600">{performer.exam}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{performer.score}%</p>
                <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Generate Reports</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <ArrowDownTrayIcon className="w-4 h-4" />
          <span>Export All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Exam Reports</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Generate detailed reports for individual exams including performance metrics and analytics.
          </p>
          <button className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
            Generate Report
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <UsersIcon className="h-8 w-8 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">User Reports</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Get insights into user performance, participation rates, and engagement metrics.
          </p>
          <button className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200">
            Generate Report
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Subject Reports</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Analyze performance by subject, topic, and question type for targeted improvements.
          </p>
          <button className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Data Insights</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Improving Performance</p>
                  <p className="text-sm text-gray-600">Average scores increased by 12% this month</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">+12%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <UsersIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">User Engagement</p>
                  <p className="text-sm text-gray-600">Active users increased by 25%</p>
                </div>
              </div>
              <span className="text-sm font-medium text-blue-600">+25%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Attention Needed</p>
                  <p className="text-sm text-gray-600">Chemistry performance needs improvement</p>
                </div>
              </div>
              <span className="text-sm font-medium text-yellow-600">-8%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Focus Areas</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Increase Chemistry practice questions</li>
                <li>• Add more Physics numerical problems</li>
                <li>• Improve time management training</li>
              </ul>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Success Factors</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Regular practice tests improve scores</li>
                <li>• Video explanations are highly effective</li>
                <li>• Peer study groups show better results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Analytics Dashboard</span>
            </div>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'reports', name: 'Generate Reports', icon: DocumentTextIcon },
              { id: 'insights', name: 'Data Insights', icon: ArrowTrendingUpIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'insights' && renderInsights()}
      </div>
    </div>
  );
} 