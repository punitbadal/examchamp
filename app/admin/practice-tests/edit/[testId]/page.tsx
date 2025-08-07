'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  AcademicCapIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface Question {
  _id: string;
  questionText: string;
  questionType: 'MCQ_Single' | 'MCQ_Multiple' | 'TrueFalse' | 'Integer' | 'Numerical';
  subject: string;
  chapter: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  options?: string[];
  correctAnswer: string | string[] | number | boolean;
  marksPerQuestion: number;
  negativeMarksPerQuestion?: number;
  explanation?: string;
  tags?: string[];
}

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
  subjects: string[];
  chapters: string[];
  topics: string[];
  questions: Question[];
  instructions: string;
  tags: string[];
}

const EditPracticeTestPage = () => {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  
  const [practiceTest, setPracticeTest] = useState<PracticeTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'questions' | 'preview'>('settings');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  useEffect(() => {
    if (testId) {
      fetchPracticeTest();
      fetchAvailableQuestions();
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
        setSelectedQuestions(data.practiceTest.questions?.map((q: Question) => q._id) || []);
      } else {
        toast.error('Failed to fetch practice test details');
        router.push('/admin/practice-tests');
      }
    } catch (error) {
      console.error('Error fetching practice test:', error);
      toast.error('Error fetching practice test details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/questions?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleSave = async () => {
    if (!practiceTest) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const updatedTest = {
        ...practiceTest,
        questions: selectedQuestions
      };

      const response = await fetch(`/api/practice-tests/${testId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTest)
      });

      if (response.ok) {
        toast.success('Practice test updated successfully');
        fetchPracticeTest();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update practice test');
      }
    } catch (error) {
      console.error('Error updating practice test:', error);
      toast.error('Error updating practice test');
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-2xl font-bold text-gray-900">Edit Practice Test</h1>
                <p className="text-gray-600">{practiceTest.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CogIcon className="w-4 h-4 inline mr-2" />
                Settings
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'questions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DocumentTextIcon className="w-4 h-4 inline mr-2" />
                Questions ({selectedQuestions.length})
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <EyeIcon className="w-4 h-4 inline mr-2" />
                Preview
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Title
                    </label>
                    <input
                      type="text"
                      value={practiceTest.title}
                      onChange={(e) => setPracticeTest(prev => prev ? {...prev, title: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Code
                    </label>
                    <input
                      type="text"
                      value={practiceTest.code}
                      onChange={(e) => setPracticeTest(prev => prev ? {...prev, code: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={practiceTest.description}
                    onChange={(e) => setPracticeTest(prev => prev ? {...prev, description: e.target.value} : null)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      value={practiceTest.settings.timeLimit}
                      onChange={(e) => setPracticeTest(prev => prev ? {
                        ...prev, 
                        settings: {...prev.settings, timeLimit: parseInt(e.target.value)}
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={practiceTest.settings.passingScore}
                      onChange={(e) => setPracticeTest(prev => prev ? {
                        ...prev, 
                        settings: {...prev.settings, passingScore: parseInt(e.target.value)}
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      value={practiceTest.settings.maxAttempts}
                      onChange={(e) => setPracticeTest(prev => prev ? {
                        ...prev, 
                        settings: {...prev.settings, maxAttempts: parseInt(e.target.value)}
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Available Questions ({availableQuestions.length})
                  </h3>
                  <div className="text-sm text-gray-600">
                    Selected: {selectedQuestions.length} questions
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Available Questions */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Available Questions</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {availableQuestions.map((question) => (
                        <div
                          key={question._id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedQuestions.includes(question._id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleQuestionSelection(question._id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {question.questionText.substring(0, 100)}...
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>{question.subject}</span>
                                <span>{question.chapter}</span>
                                <span className={`px-2 py-1 rounded ${
                                  question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                  question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {question.difficulty}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              {selectedQuestions.includes(question._id) ? (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Questions */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Selected Questions</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedQuestions.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No questions selected</p>
                      ) : (
                        availableQuestions
                          .filter(q => selectedQuestions.includes(q._id))
                          .map((question) => (
                            <div
                              key={question._id}
                              className="p-4 border border-blue-200 bg-blue-50 rounded-lg"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 mb-1">
                                    {question.questionText.substring(0, 100)}...
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>{question.subject}</span>
                                    <span>{question.chapter}</span>
                                    <span className="text-blue-600 font-medium">
                                      {question.marksPerQuestion} marks
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => toggleQuestionSelection(question._id)}
                                  className="ml-4 text-red-600 hover:text-red-800"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Test Preview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Test Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Title:</span> {practiceTest.title}</div>
                        <div><span className="font-medium">Code:</span> {practiceTest.code}</div>
                        <div><span className="font-medium">Type:</span> {practiceTest.type}</div>
                        <div><span className="font-medium">Level:</span> {practiceTest.level}</div>
                        <div><span className="font-medium">Status:</span> {practiceTest.status}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Settings</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Time Limit:</span> {practiceTest.settings.timeLimit} minutes</div>
                        <div><span className="font-medium">Passing Score:</span> {practiceTest.settings.passingScore}%</div>
                        <div><span className="font-medium">Max Attempts:</span> {practiceTest.settings.maxAttempts}</div>
                        <div><span className="font-medium">Questions:</span> {selectedQuestions.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPracticeTestPage; 