'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Question {
  _id: string;
  questionText: string;
  questionType: 'MCQ_Single' | 'MCQ_Multiple' | 'TrueFalse' | 'Integer' | 'Numerical';
  options: string[];
  correctAnswer: string | string[];
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const ViewQuestionPage = () => {
  const router = useRouter();
  const params = useParams();
  const questionId = params.questionId as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        router.push('/auth');
        return;
      }

      const response = await fetch(`/api/questions/${questionId}/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }

      const data = await response.json();
      setQuestion(data.question);
    } catch (error) {
      console.error('Error fetching question:', error);
      toast.error('Failed to fetch question');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels = {
      'MCQ_Single': 'Single Choice MCQ',
      'MCQ_Multiple': 'Multiple Choice MCQ',
      'TrueFalse': 'True/False',
      'Integer': 'Integer Type',
      'Numerical': 'Numerical Type'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'Easy': 'text-green-600 bg-green-100',
      'Medium': 'text-yellow-600 bg-yellow-100',
      'Hard': 'text-red-600 bg-red-100'
    };
    return colors[difficulty as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Question Not Found</h2>
          <p className="text-gray-600 mb-4">The question you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/questions')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Question Details</h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/admin/questions/edit/${questionId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Question
                </button>
                <button
                  onClick={() => router.push('/admin/questions')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back to Questions
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Question Text */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Question Text</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-900 whitespace-pre-wrap">{question.questionText}</p>
              </div>
            </div>

            {/* Question Type and Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Question Type</h3>
                <p className="text-gray-600">{getQuestionTypeLabel(question.questionType)}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Difficulty</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty}
                </span>
              </div>
            </div>

            {/* Options (for MCQ types) */}
            {(question.questionType === 'MCQ_Single' || question.questionType === 'MCQ_Multiple') && question.options && question.options.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Options</h3>
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-gray-900">{option}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correct Answer */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Correct Answer</h3>
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-green-800 font-medium">
                  {Array.isArray(question.correctAnswer) 
                    ? question.correctAnswer.join(', ')
                    : question.correctAnswer}
                </p>
              </div>
            </div>

            {/* Marks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Marks per Question</h3>
                <p className="text-gray-600">{question.marksPerQuestion} marks</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Negative Marks</h3>
                <p className="text-gray-600">{question.negativeMarksPerQuestion} marks</p>
              </div>
            </div>

            {/* Subject */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Subject</h3>
              <p className="text-gray-600">{question.subject}</p>
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Explanation</h3>
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-blue-900 whitespace-pre-wrap">{question.explanation}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Status</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                question.isActive 
                  ? 'text-green-600 bg-green-100' 
                  : 'text-red-600 bg-red-100'
              }`}>
                {question.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Metadata */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Question Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-gray-900">{formatDate(question.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="text-gray-900">{formatDate(question.updatedAt)}</p>
                </div>
                {question.createdBy && (
                  <div>
                    <p className="text-gray-500">Created By</p>
                    <p className="text-gray-900">
                      {question.createdBy.firstName} {question.createdBy.lastName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Question ID</p>
                  <p className="text-gray-900 font-mono text-xs">{question._id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewQuestionPage; 