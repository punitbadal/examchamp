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
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  DocumentDuplicateIcon
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

interface CSVQuestion {
  QuestionNumber: string;
  QuestionText: string;
  QuestionType: string;
  Option1?: string;
  Option2?: string;
  Option3?: string;
  Option4?: string;
  CorrectAnswer: string;
  MarksPerQuestion: string;
  NegativeMarksPerQuestion: string;
  SectionId: string;
  Difficulty: string;
  Topic: string;
  Subject: string;
  Explanation: string;
  Tags: string;
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
  
  // CSV Import states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvQuestions, setCsvQuestions] = useState<Question[]>([]);
  const [csvImportStatus, setCsvImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [csvError, setCsvError] = useState<string>('');
  const [showCsvPreview, setShowCsvPreview] = useState(false);

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
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleQuestionChange = (field: string, value: any) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.text || !currentQuestion.correctAnswer) {
      alert('Please fill in question text and correct answer');
      return;
    }

    const newQuestion: Question = {
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

  // CSV Import Functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      processCSVFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const processCSVFile = async (file: File) => {
    setCsvImportStatus('processing');
    setCsvError('');

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedQuestions: Question[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Convert CSV row to Question format
        const question: Question = {
          id: `csv_${i}`,
          text: row.QuestionText || '',
          type: (row.QuestionType as Question['type']) || 'MCQ_Single',
          options: row.QuestionType === 'MCQ_Single' || row.QuestionType === 'MCQ_Multiple' 
            ? [row.Option1, row.Option2, row.Option3, row.Option4].filter(Boolean)
            : undefined,
          correctAnswer: row.CorrectAnswer || '',
          marks: parseInt(row.MarksPerQuestion) || 4,
          explanation: row.Explanation || ''
        };

        if (question.text && question.correctAnswer) {
          parsedQuestions.push(question);
        }
      }

      setCsvQuestions(parsedQuestions);
      setCsvImportStatus('success');
      setShowCsvPreview(true);
    } catch (error) {
      console.error('Error processing CSV:', error);
      setCsvError('Error processing CSV file. Please check the format.');
      setCsvImportStatus('error');
    }
  };

  const importCSVQuestions = () => {
    setQuestions(prev => [...prev, ...csvQuestions]);
    setCsvQuestions([]);
    setCsvFile(null);
    setShowCsvPreview(false);
    setCsvImportStatus('idle');
  };

  const downloadSampleCSV = () => {
    const sampleData = `QuestionNumber,QuestionText,QuestionType,Option1,Option2,Option3,Option4,CorrectAnswer,MarksPerQuestion,NegativeMarksPerQuestion,SectionId,Difficulty,Topic,Subject,Explanation,Tags
1,What is 2+2?,MCQ_Single,3,4,5,6,4,4,1,Math,easy,Arithmetic,Mathematics,Basic addition,math,addition
2,Which are prime numbers?,MCQ_Multiple,2,3,4,5,"2,3,5",4,2,Math,medium,Number Theory,Mathematics,Prime numbers,math,prime
3,Is 7 a prime number?,TrueFalse,True,False,,,True,2,1,Math,easy,Number Theory,Mathematics,Prime number check,math,prime
4,What is the square root of 16?,Integer,,,,,4,4,1,Math,easy,Algebra,Mathematics,Square root,math,algebra
5,What is 3.14 rounded to 2 decimal places?,Numerical,,,,,3.14,4,1,Math,easy,Geometry,Mathematics,Pi approximation,math,geometry`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-questions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
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
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter test description"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Questions ({questions.length})</h3>
              <div className="flex space-x-2">
                <button
                  onClick={downloadSampleCSV}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download Sample CSV
                </button>
                <label className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center cursor-pointer">
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setShowQuestionForm(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Question
                </button>
              </div>
            </div>

            {/* CSV Import Status */}
            {csvImportStatus === 'processing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-blue-800">Processing CSV file...</span>
                </div>
              </div>
            )}

            {csvImportStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">{csvError}</span>
                </div>
              </div>
            )}

            {csvImportStatus === 'success' && showCsvPreview && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm text-green-800">
                      Successfully parsed {csvQuestions.length} questions from CSV
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={importCSVQuestions}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Import Questions
                    </button>
                    <button
                      onClick={() => {
                        setShowCsvPreview(false);
                        setCsvQuestions([]);
                        setCsvImportStatus('idle');
                      }}
                      className="px-3 py-1 text-sm border border-green-600 text-green-600 rounded hover:bg-green-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CSV Preview */}
            {showCsvPreview && csvQuestions.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">CSV Preview</h4>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Answer</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {csvQuestions.slice(0, 5).map((question, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {question.text.substring(0, 50)}...
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-500">{question.type}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{question.marks}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{question.correctAnswer}</td>
                        </tr>
                      ))}
                      {csvQuestions.length > 5 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-sm text-gray-500 text-center">
                            ... and {csvQuestions.length - 5} more questions
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Questions List */}
            {questions.length > 0 ? (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-sm text-gray-900">{question.text.substring(0, 80)}...</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {question.type}
                        </span>
                        <span className="text-xs text-gray-500">{question.marks} marks</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No questions added yet. Add questions manually or import from CSV.</p>
              </div>
            )}
          </div>

          {/* Question Form Modal */}
          {showQuestionForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Add Question</h3>
                  <button
                    onClick={() => setShowQuestionForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      value={currentQuestion.text}
                      onChange={(e) => handleQuestionChange('text', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your question"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

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
                      Explanation
                    </label>
                    <textarea
                      value={currentQuestion.explanation}
                      onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional explanation"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowQuestionForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addQuestion}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Question
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              disabled={loading || questions.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Create Practice Test
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 