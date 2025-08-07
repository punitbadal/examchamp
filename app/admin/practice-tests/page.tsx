'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  UsersIcon,
  ChartBarIcon,
  AcademicCapIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface PracticeTest {
  _id: string;
  title: string;
  code: string;
  description: string;
  type: 'topic_quiz' | 'chapter_test' | 'subject_test' | 'mock_exam' | 'custom';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  status: 'draft' | 'published' | 'archived';
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
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const PracticeTestsManagementPage = () => {
  const router = useRouter();
  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const types = [
    { value: 'topic_quiz', label: 'Topic Quiz' },
    { value: 'chapter_test', label: 'Chapter Test' },
    { value: 'subject_test', label: 'Subject Test' },
    { value: 'mock_exam', label: 'Mock Exam' },
    { value: 'custom', label: 'Custom Test' }
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const statuses = ['draft', 'published', 'archived'];

  useEffect(() => {
    fetchPracticeTests();
  }, [searchTerm, selectedType, selectedLevel, selectedStatus, sortBy, sortOrder]);

  const fetchPracticeTests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        router.push('/auth');
        return;
      }

      const params = new URLSearchParams({
        sortBy,
        sortOrder
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedType) params.append('type', selectedType);
      if (selectedLevel) params.append('level', selectedLevel);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/practice-tests?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch practice tests');
      }

      const data = await response.json();
      setPracticeTests(data.practiceTests || []);
    } catch (error) {
      console.error('Error fetching practice tests:', error);
      toast.error('Failed to load practice tests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testId: string, testTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${testTitle}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/practice-tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Practice test deleted successfully');
        fetchPracticeTests();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete practice test');
      }
    } catch (error) {
      console.error('Error deleting practice test:', error);
      toast.error('Error deleting practice test');
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeLabel = (type: string) => {
    return types.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Practice Tests Management</h1>
              <p className="mt-2 text-gray-600">Create and manage practice tests for your students</p>
            </div>
            <button
              onClick={() => router.push('/admin/practice-tests/create')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Practice Test
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Levels</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt-desc">Latest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="title-asc">Name A-Z</option>
              <option value="title-desc">Name Z-A</option>
              <option value="stats.totalAttempts-desc">Most Popular</option>
              <option value="stats.averageScore-desc">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Practice Tests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading practice tests...</p>
            </div>
          ) : practiceTests.length === 0 ? (
            <div className="p-8 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No practice tests found</h3>
              <p className="text-gray-600 mb-4">Create your first practice test to get started.</p>
              <button
                onClick={() => router.push('/admin/practice-tests/create')}
                className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Practice Test
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Settings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statistics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {practiceTests.map((test) => (
                    <tr key={test._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{test.title}</div>
                          <div className="text-sm text-gray-500">Code: {test.code}</div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {test.description}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Created: {formatDate(test.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(test.type)}`}>
                            {getTypeLabel(test.type)}
                          </span>
                          <br />
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(test.level)}`}>
                            {test.level}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {test.settings.questionCount} questions
                          </div>
                          <div className="flex items-center mb-1">
                            <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDuration(test.settings.timeLimit)}
                          </div>
                          <div className="flex items-center">
                            <AcademicCapIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {test.settings.questionCount * test.settings.marksPerQuestion} marks
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <UsersIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {test.stats.totalAttempts} attempts
                          </div>
                          <div className="flex items-center mb-1">
                            <ChartBarIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {Math.round(test.stats.averageScore)}% avg
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500">
                              {Math.round(test.stats.passRate)}% pass rate
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(test.status)}`}>
                          {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/admin/practice-tests/view/${test._id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/practice-tests/edit/${test._id}`)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(test._id, test.title)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeTestsManagementPage; 