'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Exam {
  _id: string;
  title: string;
  examCode: string;
  description: string;
  duration: number;
  totalMarks: number;
  examType: 'live' | 'practice' | 'mock';
  maxAttempts: number;
  passingScore: number;
  isActive: boolean;
  proctoringEnabled: boolean;
  sections: any[];
  createdAt: string;
  updatedAt: string;
}

interface ExamSchedule {
  id: string;
  examId: string;
  title: string;
  examCode: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  maxAttempts: number;
  totalMarks: number;
  passMarks: number;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  participants: number;
  proctoringEnabled: boolean;
  instructions: string;
  subjects: string[];
  maxParticipants?: number;
  allowedUsers?: string[];
}

export default function ExamSchedulePage() {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ExamSchedule | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    startTime: '',
    endTime: '',
    maxParticipants: '',
    proctoringEnabled: 'true',
    instructions: ''
  });

  useEffect(() => {
    fetchSchedules();
    fetchAvailableExams();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, fetch from API
      const mockSchedules: ExamSchedule[] = [
        {
          id: '1',
          examId: 'exam1',
          title: 'JEE Main Mock Test 1',
          examCode: 'JEE001',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          duration: 180,
          maxAttempts: 3,
          totalMarks: 300,
          passMarks: 120,
          status: 'scheduled',
          participants: 156,
          proctoringEnabled: true,
          instructions: 'This is a mock test for JEE Main preparation. Please ensure stable internet connection.',
          subjects: ['Physics', 'Chemistry', 'Mathematics']
        },
        {
          id: '2',
          examId: 'exam2',
          title: 'NEET Practice Test',
          examCode: 'NEET001',
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          duration: 200,
          maxAttempts: 2,
          totalMarks: 720,
          passMarks: 288,
          status: 'scheduled',
          participants: 89,
          proctoringEnabled: true,
          instructions: 'NEET practice test covering all subjects. Time management is crucial.',
          subjects: ['Physics', 'Chemistry', 'Biology']
        },
        {
          id: '3',
          examId: 'exam3',
          title: 'GATE Computer Science',
          examCode: 'GATE001',
          startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          duration: 180,
          maxAttempts: 1,
          totalMarks: 100,
          passMarks: 25,
          status: 'active',
          participants: 234,
          proctoringEnabled: false,
          instructions: 'GATE Computer Science practice test. Focus on core concepts.',
          subjects: ['Computer Science']
        }
      ];
      setSchedules(mockSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableExams = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockExams: Exam[] = [
        {
          _id: 'exam1',
          title: 'JEE Main Mock Test 1',
          examCode: 'JEE001',
          description: 'Comprehensive mock test for JEE Main preparation',
          duration: 180,
          totalMarks: 300,
          examType: 'mock',
          maxAttempts: 1,
          passingScore: 120,
          isActive: true,
          proctoringEnabled: true,
          sections: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'exam2',
          title: 'NEET Practice Test',
          examCode: 'NEET001',
          description: 'Practice test for NEET preparation',
          duration: 200,
          totalMarks: 720,
          examType: 'practice',
          maxAttempts: 3,
          passingScore: 288,
          isActive: true,
          proctoringEnabled: false,
          sections: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'exam3',
          title: 'GATE Computer Science',
          examCode: 'GATE001',
          description: 'GATE Computer Science practice test',
          duration: 180,
          totalMarks: 100,
          examType: 'live',
          maxAttempts: 1,
          passingScore: 25,
          isActive: true,
          proctoringEnabled: true,
          sections: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setAvailableExams(mockExams);
    } catch (error) {
      console.error('Error fetching available exams:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    if (!startTime) return '';
    
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    
    // Format to datetime-local format (YYYY-MM-DDTHH:MM)
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const day = String(endDate.getDate()).padStart(2, '0');
    const hours = String(endDate.getHours()).padStart(2, '0');
    const minutes = String(endDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleScheduleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setScheduleForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate end time when start time changes
    if (name === 'startTime' && selectedExam) {
      const endTime = calculateEndTime(value, selectedExam.duration);
      setScheduleForm(prev => ({
        ...prev,
        endTime
      }));
    }
  };

  const renderScheduleList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Schedules</h2>
          <p className="text-gray-600 mt-1">Schedule existing exams for specific dates and manage participant access</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Schedule New Exam</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {schedules.map((schedule) => (
          <motion.div
            key={schedule.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{schedule.title}</h3>
                <p className="text-sm text-gray-600">{schedule.examCode}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                {schedule.status}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Start: {formatDate(schedule.startDate)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">End: {formatDate(schedule.endDate)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Duration: {formatDuration(schedule.duration)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Participants: {schedule.participants}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Marks: {schedule.totalMarks} (Pass: {schedule.passMarks})</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Subjects</span>
                <span className="text-sm text-gray-600">{schedule.subjects.length}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {schedule.subjects.map((subject, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
              <button 
                onClick={() => setSelectedSchedule(schedule)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-900"
              >
                <EyeIcon className="w-4 h-4" />
                <span className="text-sm">View</span>
              </button>
              <button className="flex items-center space-x-1 text-green-600 hover:text-green-900">
                <PencilIcon className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </button>
              <button className="flex items-center space-x-1 text-red-600 hover:text-red-900">
                <TrashIcon className="w-4 h-4" />
                <span className="text-sm">Delete</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderCreateForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Schedule Existing Exam</h2>
        <button 
          onClick={() => setShowCreateForm(false)}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Schedules
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form className="space-y-6">
          {/* Exam Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exam to Schedule *
            </label>
            <select
              value={selectedExam?._id || ''}
              onChange={(e) => {
                const exam = availableExams.find(ex => ex._id === e.target.value);
                setSelectedExam(exam || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose an exam to make live</option>
              {availableExams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title} ({exam.examCode}) - {exam.examType}
                </option>
              ))}
            </select>
            {selectedExam && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">{selectedExam.title}</h4>
                <p className="text-sm text-blue-700">{selectedExam.description}</p>
                <div className="mt-2 text-xs text-blue-600">
                  Duration: {formatDuration(selectedExam.duration)} | 
                  Marks: {selectedExam.totalMarks} | 
                  Type: {selectedExam.examType}
                </div>
              </div>
            )}
          </div>

          {selectedExam && (
            <>
              {/* Schedule Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={scheduleForm.startTime}
                    onChange={handleScheduleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time * (Auto-calculated)
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={scheduleForm.endTime}
                    onChange={handleScheduleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                </div>
              </div>

              {/* Participant Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={scheduleForm.maxParticipants}
                    onChange={handleScheduleFormChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proctoring Enabled
                  </label>
                  <select 
                    name="proctoringEnabled"
                    value={scheduleForm.proctoringEnabled}
                    onChange={handleScheduleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Instructions
                </label>
                <textarea
                  name="instructions"
                  value={scheduleForm.instructions}
                  onChange={handleScheduleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter any additional instructions for participants..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Schedule
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );

  const renderScheduleDetails = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Schedule Details</h2>
        <button 
          onClick={() => setSelectedSchedule(null)}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Schedules
        </button>
      </div>

      {selectedSchedule && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Title:</span>
                  <p className="text-gray-900">{selectedSchedule.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Code:</span>
                  <p className="text-gray-900">{selectedSchedule.examCode}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSchedule.status)}`}>
                    {selectedSchedule.status}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Duration:</span>
                  <p className="text-gray-900">{formatDuration(selectedSchedule.duration)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Marks:</span>
                  <p className="text-gray-900">{selectedSchedule.totalMarks} (Pass: {selectedSchedule.passMarks})</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Start Date:</span>
                  <p className="text-gray-900">{formatDate(selectedSchedule.startDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">End Date:</span>
                  <p className="text-gray-900">{formatDate(selectedSchedule.endDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Participants:</span>
                  <p className="text-gray-900">{selectedSchedule.participants}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Max Attempts:</span>
                  <p className="text-gray-900">{selectedSchedule.maxAttempts}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Proctoring:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedSchedule.proctoringEnabled ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                  }`}>
                    {selectedSchedule.proctoringEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subjects</h3>
            <div className="flex flex-wrap gap-2">
              {selectedSchedule.subjects.map((subject, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
            <p className="text-gray-700">{selectedSchedule.instructions}</p>
          </div>
        </div>
      )}
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
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Schedule Existing Exams</span>
            </div>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCreateForm && renderCreateForm()}
        {selectedSchedule && renderScheduleDetails()}
        {!showCreateForm && !selectedSchedule && renderScheduleList()}
      </div>
    </div>
  );
} 