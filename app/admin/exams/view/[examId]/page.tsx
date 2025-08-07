'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Exam {
  _id: string;
  title: string;
  examCode: string;
  description: string;
  totalDuration: number;
  totalMarks: number;
  passingScore: number;
  maxAttempts: number;
  startTime?: string;
  endTime?: string;
  status: string;
  isActive: boolean;
  isPaid: boolean;
  price: number;
  currency: string;
  category: string;
  difficulty: string;
  sections: Array<{
    name: string;
    description: string;
    questionCount: number;
    timeLimit: number;
    marksPerQuestion: number;
    subjects: string[];
    topics: string[];
    instructions: string;
  }>;
  settings: {
    showTimer: boolean;
    showProgress: boolean;
    allowReview: boolean;
    allowMarkForReview: boolean;
    allowBackNavigation: boolean;
    autoSubmit: boolean;
    showResultsImmediately: boolean;
    showLeaderboard: boolean;
    showCorrectAnswers: boolean;
    showExplanations: boolean;
    allowCalculator: boolean;
    allowScratchpad: boolean;
    allowHighlighter: boolean;
  };
  proctoring: {
    enabled: boolean;
    webcamRequired: boolean;
    screenSharingRequired: boolean;
    tabSwitchingDetection: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ExamView() {
  const params = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      
      loadExam();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/');
    }
  }, [router]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('Loading exam with ID:', params.examId);
      console.log('Token available:', !!token);
      
      const response = await fetch(`http://localhost:3001/api/exams/${params.examId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch exam');
      }

      const data = await response.json();
      console.log('Exam data received:', data);
      setExam(data.exam);
    } catch (error) {
      console.error('Error loading exam:', error);
      setError('Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/exams/edit/${params.examId}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/exams/${params.examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete exam');
      }

      alert('Exam deleted successfully');
      router.push('/admin/exams');
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert(`Error deleting exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Exam not found</h3>
          <p className="text-gray-500 mb-4">{error || 'The exam you are looking for does not exist.'}</p>
          <Link href="/admin/exams" className="btn-primary">
            Back to Exams
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
              <Link href="/admin/exams" className="mr-4">
                <ArrowLeftIcon className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Exam Details</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleEdit}
                className="btn-secondary flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exam Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.title}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(exam.status)}`}>
                  {exam.status}
                </span>
                <span className="text-sm text-gray-600">Code: {exam.examCode}</span>
                <span className="text-sm text-gray-600">Category: {exam.category}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{exam.totalMarks} marks</div>
              <div className="text-sm text-gray-600">{exam.totalDuration} minutes</div>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">{exam.description}</p>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{exam.sections.length}</div>
              <div className="text-sm text-gray-600">Sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {exam.sections.reduce((total, section) => total + section.questionCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{exam.maxAttempts}</div>
              <div className="text-sm text-gray-600">Max Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{exam.passingScore}</div>
              <div className="text-sm text-gray-600">Passing Score</div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sections</h2>
          <div className="space-y-4">
            {exam.sections.map((section, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{section.name}</h3>
                  <div className="text-sm text-gray-600">
                    {section.questionCount} questions • {section.timeLimit} min
                  </div>
                </div>
                <p className="text-gray-600 mb-3">{section.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Marks per question:</span> {section.marksPerQuestion}
                  </div>
                  <div>
                    <span className="font-medium">Subjects:</span> {section.subjects.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Topics:</span> {section.topics.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Time limit:</span> {section.timeLimit} min
                  </div>
                </div>
                {section.instructions && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <span className="font-medium">Instructions:</span> {section.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exam Settings */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Settings</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Show Timer</span>
                {exam.settings.showTimer ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <XCircleIcon className="h-5 w-5 text-red-600" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Show Progress</span>
                {exam.settings.showProgress ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <XCircleIcon className="h-5 w-5 text-red-600" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Allow Review</span>
                {exam.settings.allowReview ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <XCircleIcon className="h-5 w-5 text-red-600" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto Submit</span>
                {exam.settings.autoSubmit ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <XCircleIcon className="h-5 w-5 text-red-600" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Show Results Immediately</span>
                {exam.settings.showResultsImmediately ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <XCircleIcon className="h-5 w-5 text-red-600" />}
              </div>
            </div>
          </div>

          {/* Proctoring Settings */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Proctoring Settings</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proctoring Enabled</span>
                {exam.proctoring.enabled ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <XCircleIcon className="h-5 w-5 text-red-600" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Webcam Required</span>
                {exam.proctoring.webcamRequired ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <XCircleIcon className="h-5 w-5 text-red-600" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Screen Sharing Required</span>
                {exam.proctoring.screenSharingRequired ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <XCircleIcon className="h-5 w-5 text-red-600" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tab Switching Detection</span>
                {exam.proctoring.tabSwitchingDetection ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <XCircleIcon className="h-5 w-5 text-red-600" />}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mb-2">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium">Start Time</span>
              </div>
              <p className="text-gray-600">{formatDate(exam.startTime)}</p>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium">End Time</span>
              </div>
              <p className="text-gray-600">{formatDate(exam.endTime)}</p>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {exam.isPaid && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Price</span>
              <span className="text-2xl font-bold text-green-600">
                {exam.price} {exam.currency}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 