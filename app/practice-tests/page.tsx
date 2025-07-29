'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  StarIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ChartBarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface PracticeTest {
  _id: string;
  title: string;
  code: string;
  description: string;
  type: 'topic_quiz' | 'chapter_test' | 'subject_test' | 'mock_exam' | 'custom';
  level: string;
  settings: {
    questionCount: number;
    timeLimit: number;
    passingScore: number;
    maxAttempts: number;
    marksPerQuestion: number;
  };
  stats: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    difficultyRating: number;
  };
  access: {
    isPaid: boolean;
    price: number;
    currency: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function PracticeTestsPage() {
  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userAttempts, setUserAttempts] = useState<string[]>([]);

  const types = [
    { value: 'topic_quiz', label: 'Topic Quiz' },
    { value: 'chapter_test', label: 'Chapter Test' },
    { value: 'subject_test', label: 'Subject Test' },
    { value: 'mock_exam', label: 'Mock Exam' },
    { value: 'custom', label: 'Custom Test' }
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const sortOptions = [
    { value: 'createdAt', label: 'Latest' },
    { value: 'stats.totalAttempts', label: 'Most Popular' },
    { value: 'stats.averageScore', label: 'Highest Rated' },
    { value: 'title', label: 'Name A-Z' }
  ];

  useEffect(() => {
    fetchPracticeTests();
    fetchUserAttempts();
  }, [currentPage, selectedType, selectedLevel, sortBy, sortOrder, searchTerm]);

  const fetchPracticeTests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy,
        sortOrder,
        status: 'published'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedType) params.append('type', selectedType);
      if (selectedLevel) params.append('level', selectedLevel);

      const response = await axios.get(`/api/practice-tests?${params}`);
      setPracticeTests(response.data.practiceTests);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching practice tests:', error);
      toast.error('Failed to load practice tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAttempts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('/api/practice-tests/user/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Extract attempted test IDs
        const attemptedIds = response.data.map((attempt: any) => attempt.practiceTestId._id);
        setUserAttempts(attemptedIds);
      }
    } catch (error) {
      console.error('Error fetching user attempts:', error);
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to start practice tests');
        return;
      }

      const response = await axios.post(`/api/practice-tests/${testId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Redirect to the test interface
      window.location.href = `/practice-tests/${testId}/attempt/${response.data.attempt._id}`;
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to start practice test');
      }
    }
  };

  const hasAttempted = (testId: string) => {
    return userAttempts.includes(testId);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'topic_quiz': return 'bg-blue-100 text-blue-800';
      case 'chapter_test': return 'bg-green-100 text-green-800';
      case 'subject_test': return 'bg-purple-100 text-purple-800';
      case 'mock_exam': return 'bg-orange-100 text-orange-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getTypeLabel = (type: string) => {
    return types.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Practice Tests
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Test your knowledge with our comprehensive collection of practice tests, 
              quizzes, and mock exams designed to help you prepare effectively.
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search practice tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {types.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={`${option.value}-${sortOrder}`}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Practice Tests Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : practiceTests.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No practice tests found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {practiceTests.map((test, index) => (
                <motion.div
                  key={test._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
                >
                  {/* Test Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-lg">
                    <div className="flex items-center justify-center h-full">
                      <DocumentTextIcon className="h-16 w-16 text-white opacity-80" />
                    </div>
                    
                    {/* Type Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(test.type)}`}>
                        {getTypeLabel(test.type)}
                      </span>
                    </div>

                    {/* Level Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(test.level)}`}>
                        {test.level}
                      </span>
                    </div>

                    {/* Attempted Badge */}
                    {hasAttempted(test._id) && (
                      <div className="absolute bottom-3 right-3">
                        <CheckCircleIcon className="h-6 w-6 text-green-500 bg-white rounded-full p-1" />
                      </div>
                    )}
                  </div>

                  {/* Test Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {test.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {test.description}
                    </p>

                    {/* Test Stats */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Questions:</span>
                        <span className="font-medium">{test.settings.questionCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">{formatDuration(test.settings.timeLimit)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Total Marks:</span>
                        <span className="font-medium">{test.settings.questionCount * test.settings.marksPerQuestion}</span>
                      </div>
                    </div>

                    {/* Performance Stats */}
                    {test.stats.totalAttempts > 0 && (
                      <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Avg Score:</span>
                          <span className="font-medium">{Math.round(test.stats.averageScore)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Pass Rate:</span>
                          <span className="font-medium">{Math.round(test.stats.passRate)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Attempts:</span>
                          <span className="font-medium">{test.stats.totalAttempts.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex items-center justify-between">
                      {test.access.isPaid ? (
                        <div className="flex items-center">
                          <LockClosedIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            ₹{test.access.price}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-green-600 font-medium">Free</span>
                      )}

                      {hasAttempted(test._id) ? (
                        <button
                          onClick={() => window.location.href = `/practice-tests/${test._id}/results`}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          View Results
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartTest(test._id)}
                          className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <PlayIcon className="h-4 w-4 mr-1" />
                          Start Test
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 