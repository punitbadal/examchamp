'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BellIcon,
  CalendarIcon,
  TrophyIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Leaderboard from '../components/Leaderboard';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
  createdAt: string;
}

interface Exam {
  id: string;
  title: string;
  examCode: string;
  subject: string;
  duration: number;
  totalMarks: number;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'completed' | 'expired';
  isLive: boolean;
}

interface PracticeTest {
  id: string;
  title: string;
  subject: string;
  questions: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  score?: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'practice' | 'results' | 'analytics' | 'leaderboard'>('overview');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    try {
      const user = JSON.parse(userData);
      
      // Check if user is student
      if (user.role === 'admin' || user.role === 'super_admin') {
        router.push('/admin');
        return;
      }
      
      setUser(user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Mock data
  const upcomingExams: Exam[] = [
    {
      id: '1',
      title: 'JEE Main Mock Test 1',
      examCode: 'JEE001',
      subject: 'Physics, Chemistry, Mathematics',
      duration: 180,
      totalMarks: 300,
      startTime: '2025-01-15T10:00:00Z',
      endTime: '2025-01-15T13:00:00Z',
      status: 'upcoming',
      isLive: true
    },
    {
      id: '2',
      title: 'NEET Practice Test',
      examCode: 'NEET001',
      subject: 'Biology, Chemistry, Physics',
      duration: 200,
      totalMarks: 720,
      startTime: '2025-01-20T14:00:00Z',
      endTime: '2025-01-20T17:20:00Z',
      status: 'upcoming',
      isLive: false
    }
  ];

  const practiceTests: PracticeTest[] = [
    {
      id: '1',
      title: 'Physics - Mechanics',
      subject: 'Physics',
      questions: 25,
      duration: 60,
      difficulty: 'medium',
      completed: true,
      score: 85
    },
    {
      id: '2',
      title: 'Chemistry - Organic',
      subject: 'Chemistry',
      questions: 30,
      duration: 75,
      difficulty: 'hard',
      completed: false
    },
    {
      id: '3',
      title: 'Mathematics - Calculus',
      subject: 'Mathematics',
      questions: 20,
      duration: 45,
      difficulty: 'easy',
      completed: true,
      score: 92
    }
  ];

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ExamTech Student</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 p-2">
                <BellIcon className="h-5 w-5" />
              </button>
              <div className="relative">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                  <UserIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Student
                  </span>
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.firstName}! 👨‍🎓
          </h1>
          <p className="text-gray-600 mt-2">
            Ready to ace your exams? Check out your upcoming tests and practice materials.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Exams</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingExams.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Practice Tests</p>
                <p className="text-2xl font-bold text-gray-900">{practiceTests.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <BookOpenIcon className="h-6 w-6 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {practiceTests.filter(test => test.completed).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-purple-600" />
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
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {practiceTests.filter(test => test.completed && test.score).length > 0
                    ? Math.round(practiceTests.filter(test => test.completed && test.score)
                        .reduce((sum, test) => sum + (test.score || 0), 0) / 
                        practiceTests.filter(test => test.completed && test.score).length)
                    : 0}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrophyIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'exams', name: 'Exams', icon: DocumentTextIcon },
                { id: 'practice', name: 'Practice Tests', icon: BookOpenIcon },
                { id: 'results', name: 'Results', icon: TrophyIcon },
                { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
                { id: 'leaderboard', name: 'Leaderboard', icon: TrophyIcon }
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upcoming Exams */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Exams</h3>
                    <div className="space-y-4">
                      {upcomingExams.slice(0, 3).map((exam) => (
                        <div key={exam.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{exam.title}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exam.status)}`}>
                              {exam.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{exam.subject}</p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Duration: {formatTime(exam.duration)}</span>
                            <span>Marks: {exam.totalMarks}</span>
                          </div>
                          <div className="mt-3">
                            <Link
                              href={`/exam/${exam.id}`}
                              className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 hover:bg-blue-50"
                            >
                              <PlayIcon className="h-3 w-3 mr-1" />
                              Start Exam
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Practice Tests */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Practice Tests</h3>
                    <div className="space-y-4">
                      {practiceTests.slice(0, 3).map((test) => (
                        <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{test.title}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(test.difficulty)}`}>
                              {test.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{test.subject}</p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{test.questions} questions</span>
                            <span>{formatTime(test.duration)}</span>
                            {test.completed && test.score && (
                              <span className="text-green-600 font-medium">{test.score}%</span>
                            )}
                          </div>
                          <div className="mt-3">
                            {test.completed ? (
                              <span className="inline-flex items-center px-3 py-1 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Completed
                              </span>
                            ) : (
                              <Link
                                href={`/practice/${test.id}`}
                                className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 hover:bg-blue-50"
                              >
                                <PlayIcon className="h-3 w-3 mr-1" />
                                Start Test
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Exams Tab */}
            {activeTab === 'exams' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">All Exams</h3>
                  <div className="flex space-x-2">
                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>All Subjects</option>
                      <option>Physics</option>
                      <option>Chemistry</option>
                      <option>Mathematics</option>
                    </select>
                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>All Status</option>
                      <option>Upcoming</option>
                      <option>Active</option>
                      <option>Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingExams.map((exam) => (
                    <div key={exam.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-semibold text-gray-900">{exam.title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exam.status)}`}>
                          {exam.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <p className="text-sm text-gray-600">{exam.subject}</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium">{formatTime(exam.duration)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Total Marks:</span>
                          <span className="font-medium">{exam.totalMarks}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Type:</span>
                          <span className="font-medium">{exam.isLive ? 'Live' : 'Practice'}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Link
                          href={`/exam/${exam.id}`}
                          className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                          Start Exam
                        </Link>
                        <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Practice Tests Tab */}
            {activeTab === 'practice' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Practice Tests</h3>
                  <div className="flex space-x-2">
                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>All Subjects</option>
                      <option>Physics</option>
                      <option>Chemistry</option>
                      <option>Mathematics</option>
                    </select>
                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>All Difficulties</option>
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {practiceTests.map((test) => (
                    <div key={test.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-semibold text-gray-900">{test.title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(test.difficulty)}`}>
                          {test.difficulty}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <p className="text-sm text-gray-600">{test.subject}</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Questions:</span>
                          <span className="font-medium">{test.questions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium">{formatTime(test.duration)}</span>
                        </div>
                        {test.completed && test.score && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Score:</span>
                            <span className="font-medium text-green-600">{test.score}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        {test.completed ? (
                          <button className="flex-1 bg-green-100 text-green-700 text-center py-2 px-4 rounded-md text-sm font-medium">
                            <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                            Completed
                          </button>
                        ) : (
                          <Link
                            href={`/practice/${test.id}`}
                            className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700"
                          >
                            Start Test
                          </Link>
                        )}
                        <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Exam Results</h3>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <p className="text-yellow-800 text-sm">
                      Results will appear here once you complete exams. Practice tests show immediate results.
                    </p>
                  </div>
                </div>

                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h4>
                  <p className="text-gray-500 mb-4">
                    Complete your first exam to see your results here.
                  </p>
                  <Link
                    href="#exams"
                    onClick={() => setActiveTab('exams')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Start an Exam
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AnalyticsDashboard studentId={user?.id} />
              </motion.div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Leaderboard type="overall" timeFrame="month" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 