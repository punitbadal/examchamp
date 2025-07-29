'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Exam {
  id: string;
  title: string;
  examCode: string;
  description: string;
  subject: string;
  duration: number; // in minutes
  totalMarks: number;
  startTime: string;
  endTime: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  isActive: boolean;
  maxAttempts: number;
  passingScore: number;
  totalQuestions: number;
  enrolledStudents: number;
  createdAt: string;
  updatedAt: string;
}

export default function ExamManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);

  useEffect(() => {
    // Check if user is authenticated and is admin
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      window.location.href = '/';
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        window.location.href = '/dashboard';
        return;
      }
      
      loadExams();
    } catch (error) {
      console.error('Error parsing user data:', error);
      window.location.href = '/';
    }
  }, []);

  const loadExams = async () => {
    try {
      // In a real app, you would fetch this from your API
      // For now, we'll use mock data
      const mockExams: Exam[] = [
        {
          id: '1',
          title: 'JEE Main Mock Test 1',
          examCode: 'JEE001',
          description: 'Comprehensive mock test for JEE Main preparation',
          subject: 'Engineering',
          duration: 180,
          totalMarks: 300,
          startTime: '2025-07-30T10:00:00Z',
          endTime: '2025-07-30T13:00:00Z',
          status: 'scheduled',
          isActive: true,
          maxAttempts: 3,
          passingScore: 180,
          totalQuestions: 75,
          enrolledStudents: 45,
          createdAt: '2025-07-25T10:00:00.000Z',
          updatedAt: '2025-07-25T10:00:00.000Z'
        },
        {
          id: '2',
          title: 'CAT Practice Test',
          examCode: 'CAT001',
          description: 'Practice test for Common Admission Test',
          subject: 'Management',
          duration: 180,
          totalMarks: 300,
          startTime: '2025-08-01T14:00:00Z',
          endTime: '2025-08-01T17:00:00Z',
          status: 'draft',
          isActive: false,
          maxAttempts: 2,
          passingScore: 150,
          totalQuestions: 100,
          enrolledStudents: 0,
          createdAt: '2025-07-24T15:30:00.000Z',
          updatedAt: '2025-07-24T15:30:00.000Z'
        },
        {
          id: '3',
          title: 'NEET Biology Test',
          examCode: 'NEET001',
          description: 'Biology section practice for NEET',
          subject: 'Medical',
          duration: 120,
          totalMarks: 200,
          startTime: '2025-07-29T09:00:00Z',
          endTime: '2025-07-29T11:00:00Z',
          status: 'active',
          isActive: true,
          maxAttempts: 1,
          passingScore: 120,
          totalQuestions: 50,
          enrolledStudents: 78,
          createdAt: '2025-07-23T12:00:00.000Z',
          updatedAt: '2025-07-23T12:00:00.000Z'
        },
        {
          id: '4',
          title: 'UPSC Prelims Mock',
          examCode: 'UPSC001',
          description: 'Mock test for UPSC Civil Services Prelims',
          subject: 'Civil Services',
          duration: 120,
          totalMarks: 200,
          startTime: '2025-07-28T10:00:00Z',
          endTime: '2025-07-28T12:00:00Z',
          status: 'completed',
          isActive: false,
          maxAttempts: 1,
          passingScore: 100,
          totalQuestions: 100,
          enrolledStudents: 120,
          createdAt: '2025-07-22T08:00:00.000Z',
          updatedAt: '2025-07-22T08:00:00.000Z'
        }
      ];

      setExams(mockExams);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubjectBadgeColor = (subject: string) => {
    switch (subject) {
      case 'Engineering':
        return 'bg-blue-100 text-blue-800';
      case 'Medical':
        return 'bg-green-100 text-green-800';
      case 'Management':
        return 'bg-purple-100 text-purple-800';
      case 'Civil Services':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = 
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.examCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    const matchesSubject = subjectFilter === 'all' || exam.subject === subjectFilter;
    
    return matchesSearch && matchesStatus && matchesSubject;
  });

  const sortedExams = [...filteredExams].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Exam];
    let bValue: any = b[sortBy as keyof Exam];
    
    if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'startTime' || sortBy === 'endTime') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedExams.length === sortedExams.length) {
      setSelectedExams([]);
    } else {
      setSelectedExams(sortedExams.map(exam => exam.id));
    }
  };

  const handleSelectExam = (examId: string) => {
    setSelectedExams(prev => 
      prev.includes(examId) 
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  const handleBulkAction = (action: string) => {
    // Implement bulk actions (activate, deactivate, delete, etc.)
    console.log(`Bulk action: ${action} for exams:`, selectedExams);
    alert(`${action} action will be performed on ${selectedExams.length} exams`);
  };

  const handleStatusChange = (examId: string, newStatus: string) => {
    setExams(prev => prev.map(exam => 
      exam.id === examId ? { ...exam, status: newStatus as Exam['status'] } : exam
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Exam Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
              <p className="text-gray-600 mt-2">
                Create, manage, and monitor all examinations in the system.
              </p>
            </div>
            <Link
              href="/admin/exams/create"
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Exam
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Subject Filter */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Subjects</option>
              <option value="Engineering">Engineering</option>
              <option value="Medical">Medical</option>
              <option value="Management">Management</option>
              <option value="Civil Services">Civil Services</option>
            </select>

            {/* Bulk Actions */}
            {selectedExams.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Activate ({selectedExams.length})
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
                >
                  Deactivate ({selectedExams.length})
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  Delete ({selectedExams.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedExams.map((exam) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Exam Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(exam.status)}`}>
                        {exam.status}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubjectBadgeColor(exam.subject)}`}>
                        {exam.subject}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{exam.description}</p>
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center mb-1">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Code: {exam.examCode}
                      </div>
                      <div className="flex items-center mb-1">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Duration: {exam.duration} minutes
                      </div>
                      <div className="flex items-center mb-1">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        Enrolled: {exam.enrolledStudents} students
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedExams.includes(exam.id)}
                    onChange={() => handleSelectExam(exam.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Exam Details */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Marks</p>
                    <p className="text-sm font-medium">{exam.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Questions</p>
                    <p className="text-sm font-medium">{exam.totalQuestions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Passing Score</p>
                    <p className="text-sm font-medium">{exam.passingScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Max Attempts</p>
                    <p className="text-sm font-medium">{exam.maxAttempts}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-500">
                    <CalendarIcon className="inline h-3 w-3 mr-1" />
                    Start: {formatDate(exam.startTime)}
                  </div>
                  <div className="text-xs text-gray-500">
                    <CalendarIcon className="inline h-3 w-3 mr-1" />
                    End: {formatDate(exam.endTime)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 p-1">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900 p-1">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 p-1">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Status Actions */}
                  <div className="flex space-x-1">
                    {exam.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(exam.id, 'scheduled')}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Schedule
                      </button>
                    )}
                    {exam.status === 'scheduled' && (
                      <button
                        onClick={() => handleStatusChange(exam.id, 'active')}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        <PlayIcon className="h-3 w-3" />
                      </button>
                    )}
                    {exam.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(exam.id, 'completed')}
                        className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                      >
                        <PauseIcon className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {sortedExams.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || subjectFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first exam.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 