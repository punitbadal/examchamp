'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface CreatePracticeTestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface Question {
  id: string;
  text: string;
  type: 'MCQ_Single' | 'MCQ_Multiple' | 'TrueFalse' | 'Integer' | 'Numerical';
  options?: string[];
  correctAnswer: string | string[];
  marks: number;
  explanation?: string;
}

export default function CreatePracticeTestForm({ isOpen, onClose, onSubmit }: CreatePracticeTestFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'topic_quiz',
    level: 'Intermediate',
    subjects: [],
    topics: [],
    settings: {
      questionCount: 20,
      timeLimit: 60,
      passingScore: 60,
      maxAttempts: 3,
      difficultyDistribution: {
        easy: 0.3,
        medium: 0.5,
        hard: 0.2
      },
      questionTypes: ['MCQ_Single'],
      marksPerQuestion: 4,
      negativeMarksPerQuestion: 1,
      showTimer: true,
      allowReview: true,
      shuffleQuestions: true
    },
    access: {
      enrollmentRequired: false,
      isPublic: true,
      isPremium: false
    }
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    text: '',
    type: 'MCQ_Single',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 4,
    explanation: ''
  });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const questionTypes = [
    { value: 'MCQ_Single', label: 'Single Choice MCQ' },
    { value: 'MCQ_Multiple', label: 'Multiple Choice MCQ' },
    { value: 'TrueFalse', label: 'True/False' },
    { value: 'Integer', label: 'Integer Answer' },
    { value: 'Numerical', label: 'Numerical Answer' }
  ];

  const testTypes = [
    { value: 'topic_quiz', label: 'Topic Quiz' },
    { value: 'chapter_test', label: 'Chapter Test' },
    { value: 'subject_test', label: 'Subject Test' },
    { value: 'mock_exam', label: 'Mock Exam' },
    { value: 'custom', label: 'Custom Test' }
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'English'];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleQuestionChange = (field: string, value: any) => {
    setCurrentQuestion(prev => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
    if (!currentQuestion.text || !currentQuestion.correctAnswer) {
      alert('Please fill in question text and correct answer');
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now().toString()
    };

    setQuestions(prev => [...prev, newQuestion]);
    setCurrentQuestion({
      id: '',
      text: '',
      type: 'MCQ_Single',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 4,
      explanation: ''
    });
    setShowQuestionForm(false);
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in title and description');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    setLoading(true);
    try {
      const testData = {
        ...formData,
        questions,
        code: `PT${Date.now()}`,
        totalMarks: questions.reduce((sum, q) => sum + q.marks, 0)
      };
      
      await onSubmit(testData);
      onClose();
    } catch (error) {
      console.error('Error creating practice test:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Create Practice Test</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter test title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {testTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={formData.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Count
              </label>
              <input
                type="number"
                value={formData.settings.questionCount}
                onChange={(e) => handleInputChange('settings.questionCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                value={formData.settings.timeLimit}
                onChange={(e) => handleInputChange('settings.timeLimit', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="5"
                max="480"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%)
              </label>
              <input
                type="number"
                value={formData.settings.passingScore}
                onChange={(e) => handleInputChange('settings.passingScore', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter test description"
            />
          </div>

          {/* Questions Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Questions ({questions.length})</h3>
              <button
                onClick={() => setShowQuestionForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Question</span>
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                    <span className="text-sm text-gray-900">{question.text.substring(0, 50)}...</span>
                    <span className="text-xs text-gray-500">({question.type})</span>
                  </div>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Question Form */}
            {showQuestionForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <h4 className="text-md font-semibold text-gray-900 mb-4">Add New Question</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      value={currentQuestion.text}
                      onChange={(e) => handleQuestionChange('text', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter question text"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type
                      </label>
                      <select
                        value={currentQuestion.type}
                        onChange={(e) => handleQuestionChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {questionTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marks
                      </label>
                      <input
                        type="number"
                        value={currentQuestion.marks}
                        onChange={(e) => handleQuestionChange('marks', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  {/* Options for MCQ */}
                  {(currentQuestion.type === 'MCQ_Single' || currentQuestion.type === 'MCQ_Multiple') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options
                      </label>
                      <div className="space-y-2">
                        {currentQuestion.options?.map((option, index) => (
                          <input
                            key={index}
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[index] = e.target.value;
                              handleQuestionChange('options', newOptions);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`Option ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answer *
                    </label>
                    <input
                      type="text"
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter correct answer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explanation (Optional)
                    </label>
                    <textarea
                      value={currentQuestion.explanation}
                      onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter explanation for the answer"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={addQuestion}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>Add Question</span>
                    </button>
                    <button
                      onClick={() => setShowQuestionForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Access Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.access.isPublic}
                  onChange={(e) => handleInputChange('access.isPublic', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Public Access</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.access.isPremium}
                  onChange={(e) => handleInputChange('access.isPremium', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Premium Content</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.access.enrollmentRequired}
                  onChange={(e) => handleInputChange('access.enrollmentRequired', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enrollment Required</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>* Required fields</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  <span>Create Test</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 