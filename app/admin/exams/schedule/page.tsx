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
  const [examsLoading, setExamsLoading] = useState(false);
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
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchSchedules();
    fetchAvailableExams();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/exam-schedules', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch schedules');
      }

      const data = await response.json();
      console.log('Schedules data received:', data);
      
      // Transform API data to match our interface
      const transformedSchedules: ExamSchedule[] = data.schedules.map((schedule: any) => ({
        id: schedule._id,
        examId: schedule.examId._id || schedule.examId,
        title: schedule.title,
        examCode: schedule.examCode,
        startDate: new Date(schedule.startDate),
        endDate: new Date(schedule.endDate),
        duration: schedule.duration,
        maxAttempts: schedule.maxAttempts,
        totalMarks: schedule.totalMarks,
        passMarks: schedule.passMarks,
        status: schedule.status,
        participants: schedule.participants,
        proctoringEnabled: schedule.proctoringEnabled,
        instructions: schedule.instructions,
        subjects: schedule.subjects || [],
        maxParticipants: schedule.maxParticipants,
        allowedUsers: schedule.allowedUsers
      }));

      setSchedules(transformedSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableExams = async () => {
    try {
      setExamsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('http://localhost:3001/api/exams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }

      const data = await response.json();
      
      // Transform API data to match our interface
      const exams: Exam[] = data.exams.map((exam: any) => ({
        _id: exam._id,
        title: exam.title,
        examCode: exam.examCode,
        description: exam.description,
        duration: exam.totalDuration,
        totalMarks: exam.totalMarks,
        examType: exam.examType || 'live',
        maxAttempts: exam.maxAttempts,
        passingScore: exam.passingScore,
        isActive: exam.isActive,
        proctoringEnabled: exam.proctoring?.enabled || false,
        sections: exam.sections || [],
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt
      }));

      setAvailableExams(exams);
    } catch (error) {
      console.error('Error fetching available exams:', error);
      // Fallback to empty array if API fails
      setAvailableExams([]);
    } finally {
      setExamsLoading(false);
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



  const validateScheduleForm = () => {
    const errors: {[key: string]: string} = {};

    // Validate exam selection
    if (!selectedExam) {
      errors.exam = 'Please select an exam to schedule';
    }

    // Validate start time
    if (!scheduleForm.startTime) {
      errors.startTime = 'Start date and time is required';
    }

    // Validate end time
    if (!scheduleForm.endTime) {
      errors.endTime = 'End date and time is required';
    }

    // Validate that end time is after start time
    if (scheduleForm.startTime && scheduleForm.endTime) {
      const startDate = new Date(scheduleForm.startTime);
      const endDate = new Date(scheduleForm.endTime);
      
      if (endDate <= startDate) {
        errors.endTime = 'End date and time must be after start date and time';
      }
    }

    // Validate that start time is in the future
    if (scheduleForm.startTime) {
      const startDate = new Date(scheduleForm.startTime);
      const now = new Date();
      
      if (startDate <= now) {
        errors.startTime = 'Start date and time must be in the future';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleScheduleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setScheduleForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateScheduleForm()) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Authentication token not found');
          return;
        }

        const scheduleData = {
          examId: selectedExam?._id,
          startDate: scheduleForm.startTime,
          endDate: scheduleForm.endTime,
          maxParticipants: scheduleForm.maxParticipants ? parseInt(scheduleForm.maxParticipants) : undefined,
          proctoringEnabled: scheduleForm.proctoringEnabled === 'true',
          instructions: scheduleForm.instructions
        };

        const response = await fetch('http://localhost:3001/api/exam-schedules', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scheduleData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create schedule');
        }

        const result = await response.json();
        console.log('Schedule created:', result);
        
        alert('Schedule created successfully!');
        setShowCreateForm(false);
        setScheduleForm({
          startTime: '',
          endTime: '',
          maxParticipants: '',
          proctoringEnabled: 'true',
          instructions: ''
        });
        setFormErrors({});
        setSelectedExam(null);
        
        // Refresh the schedules list
        fetchSchedules();
      } catch (error) {
        console.error('Error creating schedule:', error);
        alert(`Error creating schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('Form validation failed:', formErrors);
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
        <form className="space-y-6" onSubmit={handleScheduleSubmit}>
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
                  // Clear error when user selects an exam
                  if (formErrors.exam) {
                    setFormErrors(prev => ({ ...prev, exam: '' }));
                  }
                }}
                disabled={examsLoading}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  formErrors.exam ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {examsLoading ? 'Loading exams...' : availableExams.length === 0 ? 'No exams available' : 'Choose an exam to make live'}
                </option>
                {availableExams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.title} ({exam.examCode}) - {exam.examType}
                  </option>
                ))}
              </select>
              {formErrors.exam && (
                <p className="mt-1 text-sm text-red-600">{formErrors.exam}</p>
              )}
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
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Start and End times control when the exam is visible to students. 
                  The actual exam timer during the test is based on the exam duration set during exam creation.
                </p>
              </div>
              
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
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.startTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.startTime && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.startTime}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={scheduleForm.endTime}
                    onChange={handleScheduleFormChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.endTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.endTime && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.endTime}</p>
                  )}
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