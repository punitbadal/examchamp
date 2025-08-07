'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  AcademicCapIcon,
  UsersIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  CogIcon
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
    negativeMarksPerQuestion: number;
  };
  stats: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    difficultyRating: number;
  };
  access: {
    isPublic: boolean;
    isPaid: boolean;
    price: number;
    currency: string;
  };
  subjects: string[];
  chapters: string[];
  exams: string[];
  topics: string[];
  tags: string[];
  instructions: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const PracticeTestViewPage = () => {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  
  const [practiceTest, setPracticeTest] = useState<PracticeTest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (testId) {
      fetchPracticeTest();
    }
  }, [testId]);

  const fetchPracticeTest = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/practice-tests/${testId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPracticeTest(data.practiceTest);
      } else {
        toast.error('Failed to fetch practice test details');
        router.push('/admin/practice-tests');
      }
    } catch (error) {
      console.error('Error fetching practice test:', error);
      toast.error('Error fetching practice test details');
      router.push('/admin/practice-tests');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/practice-tests/edit/${testId}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this practice test? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/practice-tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Practice test deleted successfully');
        router.push('/admin/practice-tests');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete practice test');
      }
    } catch (error) {
      console.error('Error deleting practice test:', error);
      toast.error('Error deleting practice test');
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'topic_quiz': 'Topic Quiz',
      'chapter_test': 'Chapter Test',
      'subject_test': 'Subject Test',
      'mock_exam': 'Mock Exam',
      'custom': 'Custom Test'
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'topic_quiz': 'bg-blue-100 text-blue-800',
      'chapter_test': 'bg-green-100 text-green-800',
      'subject_test': 'bg-purple-100 text-purple-800',
      'mock_exam': 'bg-orange-100 text-orange-800',
      'custom': 'bg-gray-100 text-gray-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const getLevelColor = (level: string) => {
    const colorMap: Record<string, string> = {
      'Beginner': 'bg-green-100 text-green-800',
      'Intermediate': 'bg-yellow-100 text-yellow-800',
      'Advanced': 'bg-orange-100 text-orange-800',
      'Expert': 'bg-red-100 text-red-800'
    };
    return colorMap[level] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'published': 'bg-green-100 text-green-800',
      'archived': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading practice test details...</p>
        </div>
      </div>
    );
  }

  if (!practiceTest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Practice test not found</p>
          <button
            onClick={() => router.push('/admin/practice-tests')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Practice Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{practiceTest.title}</h1>
                <p className="text-gray-600">Practice Test Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-sm text-gray-900">{practiceTest.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Code</label>
                  <p className="mt-1 text-sm text-gray-900">{practiceTest.code}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{practiceTest.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${getTypeColor(practiceTest.type)}`}>
                      {getTypeLabel(practiceTest.type)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Level</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${getLevelColor(practiceTest.level)}`}>
                      {practiceTest.level}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(practiceTest.status)}`}>
                      {practiceTest.status.charAt(0).toUpperCase() + practiceTest.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <CogIcon className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Test Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{practiceTest.settings.questionCount} Questions</p>
                    <p className="text-xs text-gray-500">Total questions</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <ClockIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDuration(practiceTest.settings.timeLimit)}</p>
                    <p className="text-xs text-gray-500">Time limit</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <AcademicCapIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{practiceTest.settings.questionCount * practiceTest.settings.marksPerQuestion} Marks</p>
                    <p className="text-xs text-gray-500">Total marks</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <ChartBarIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{practiceTest.settings.passingScore}%</p>
                    <p className="text-xs text-gray-500">Passing score</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <UsersIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{practiceTest.settings.maxAttempts} Attempts</p>
                    <p className="text-xs text-gray-500">Max attempts</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{practiceTest.settings.marksPerQuestion} Marks/Question</p>
                    <p className="text-xs text-gray-500">Per question</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            {practiceTest.instructions && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-gray-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Instructions</h2>
                </div>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{practiceTest.instructions}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Statistics</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Attempts</span>
                  <span className="text-sm font-medium text-gray-900">{practiceTest.stats.totalAttempts}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className="text-sm font-medium text-gray-900">{Math.round(practiceTest.stats.averageScore)}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pass Rate</span>
                  <span className="text-sm font-medium text-gray-900">{Math.round(practiceTest.stats.passRate)}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Difficulty Rating</span>
                  <span className="text-sm font-medium text-gray-900">{practiceTest.stats.difficultyRating}/5</span>
                </div>
              </div>
            </div>

            {/* Access Control */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <EyeIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Access Control</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Public</span>
                  <span className={`text-sm font-medium ${practiceTest.access.isPublic ? 'text-green-600' : 'text-red-600'}`}>
                    {practiceTest.access.isPublic ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Paid</span>
                  <span className={`text-sm font-medium ${practiceTest.access.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                    {practiceTest.access.isPaid ? 'Yes' : 'No'}
                  </span>
                </div>

                {practiceTest.access.isPaid && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price</span>
                    <span className="text-sm font-medium text-gray-900">
                      {practiceTest.access.price} {practiceTest.access.currency}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <CalendarIcon className="w-6 h-6 text-gray-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Metadata</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Created by</span>
                  <p className="text-sm font-medium text-gray-900">
                    {practiceTest.createdBy.firstName} {practiceTest.createdBy.lastName}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Created</span>
                  <p className="text-sm font-medium text-gray-900">{formatDate(practiceTest.createdAt)}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <p className="text-sm font-medium text-gray-900">{formatDate(practiceTest.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {practiceTest.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <TagIcon className="w-6 h-6 text-indigo-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {practiceTest.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeTestViewPage; 