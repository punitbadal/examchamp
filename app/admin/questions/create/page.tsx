'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Subject {
  _id: string;
  name: string;
  code: string;
  category: string;
}

interface Chapter {
  _id: string;
  name: string;
  code: string;
  chapterNumber: number;
  subjectId: string;
}

interface Topic {
  _id: string;
  name: string;
  code: string;
  topicNumber: number;
  chapterId: string;
}

interface QuestionForm {
  questionText: string;
  questionType: 'mcq' | 'numerical' | 'matrix_match' | 'assertion_reason';
  subject: string;
  chapter: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  imageUrl: string;
  tags: string[];
  isActive: boolean;
}

interface QuestionFormErrors {
  questionText?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  marks?: string;
  negativeMarks?: string;
  options?: string;
  correctAnswer?: string;
  explanation?: string;
}

export default function CreateQuestion() {
  const router = useRouter();
  const [formData, setFormData] = useState<QuestionForm>({
    questionText: '',
    questionType: 'mcq',
    subject: '',
    chapter: '',
    topic: '',
    difficulty: 'medium',
    marks: 4,
    negativeMarks: 1,
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    imageUrl: '',
    tags: [],
    isActive: true
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<QuestionFormErrors>({});

  useEffect(() => {
    // Check if user is authenticated and is admin
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
      
      loadSubjects();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/');
    }
  }, [router]);

  const loadSubjects = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockSubjects: Subject[] = [
        { _id: '1', name: 'Physics', code: 'PHY', category: 'Science' },
        { _id: '2', name: 'Chemistry', code: 'CHEM', category: 'Science' },
        { _id: '3', name: 'Mathematics', code: 'MATH', category: 'Science' },
        { _id: '4', name: 'Biology', code: 'BIO', category: 'Science' },
        { _id: '5', name: 'English', code: 'ENG', category: 'Language' },
        { _id: '6', name: 'Computer Science', code: 'CS', category: 'Technology' }
      ];
      setSubjects(mockSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadChapters = async (subjectId: string) => {
    try {
      // Mock data - in real app, fetch from API based on subjectId
      const mockChapters: Chapter[] = [
        { _id: '1', name: 'Mechanics', code: 'MECH', chapterNumber: 1, subjectId: '1' },
        { _id: '2', name: 'Thermodynamics', code: 'THERMO', chapterNumber: 2, subjectId: '1' },
        { _id: '3', name: 'Electromagnetism', code: 'EM', chapterNumber: 3, subjectId: '1' },
        { _id: '4', name: 'Organic Chemistry', code: 'ORG', chapterNumber: 1, subjectId: '2' },
        { _id: '5', name: 'Inorganic Chemistry', code: 'INORG', chapterNumber: 2, subjectId: '2' },
        { _id: '6', name: 'Calculus', code: 'CALC', chapterNumber: 1, subjectId: '3' },
        { _id: '7', name: 'Algebra', code: 'ALG', chapterNumber: 2, subjectId: '3' }
      ];
      const filteredChapters = mockChapters.filter(chapter => chapter.subjectId === subjectId);
      setChapters(filteredChapters);
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const loadTopics = async (chapterId: string) => {
    try {
      // Mock data - in real app, fetch from API based on chapterId
      const mockTopics: Topic[] = [
        { _id: '1', name: 'Newton\'s Laws', code: 'NEWTON', topicNumber: 1, chapterId: '1' },
        { _id: '2', name: 'Work and Energy', code: 'WORK', topicNumber: 2, chapterId: '1' },
        { _id: '3', name: 'Momentum', code: 'MOMENTUM', topicNumber: 3, chapterId: '1' },
        { _id: '4', name: 'First Law', code: 'FIRST', topicNumber: 1, chapterId: '2' },
        { _id: '5', name: 'Second Law', code: 'SECOND', topicNumber: 2, chapterId: '2' },
        { _id: '6', name: 'Integration', code: 'INT', topicNumber: 1, chapterId: '6' },
        { _id: '7', name: 'Differentiation', code: 'DIFF', topicNumber: 2, chapterId: '6' }
      ];
      const filteredTopics = mockTopics.filter(topic => topic.chapterId === chapterId);
      setTopics(filteredTopics);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Handle hierarchy changes
    if (name === 'subject') {
      setFormData(prev => ({
        ...prev,
        chapter: '',
        topic: ''
      }));
      setChapters([]);
      setTopics([]);
      if (value) {
        loadChapters(value);
      }
    } else if (name === 'chapter') {
      setFormData(prev => ({
        ...prev,
        topic: ''
      }));
      setTopics([]);
      if (value) {
        loadTopics(value);
      }
    }

    // Clear error when user starts typing
    if (errors[name as keyof QuestionFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  };

  const handleTagAdd = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: QuestionFormErrors = {};

    if (!formData.questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.chapter.trim()) {
      newErrors.chapter = 'Chapter is required';
    }

    if (!formData.topic.trim()) {
      newErrors.topic = 'Topic is required';
    }

    if (formData.marks <= 0) {
      newErrors.marks = 'Marks must be greater than 0';
    }

    if (formData.negativeMarks < 0) {
      newErrors.negativeMarks = 'Negative marks cannot be negative';
    }

    if (formData.questionType === 'mcq') {
      const validOptions = formData.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        newErrors.options = 'At least 2 options are required';
      }
      if (!formData.correctAnswer) {
        newErrors.correctAnswer = 'Correct answer is required';
      }
    }

    if (formData.questionType === 'numerical') {
      if (!formData.correctAnswer) {
        newErrors.correctAnswer = 'Correct answer is required';
      }
    }

    if (formData.questionType === 'matrix_match') {
      if (!Array.isArray(formData.correctAnswer) || formData.correctAnswer.length === 0) {
        newErrors.correctAnswer = 'Correct answer mapping is required';
      }
    }

    if (formData.questionType === 'assertion_reason') {
      if (!formData.correctAnswer) {
        newErrors.correctAnswer = 'Correct answer is required';
      }
    }

    if (!formData.explanation.trim()) {
      newErrors.explanation = 'Explanation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // In a real app, you would send this to your API
      const payload = {
        ...formData,
        options: formData.questionType === 'mcq' ? formData.options.filter(opt => opt.trim()) : undefined
      };

      console.log('Creating question with payload:', payload);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Question created successfully!');
      router.push('/admin/questions');
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Error creating question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const renderQuestionTypeForm = () => {
    switch (formData.questionType) {
      case 'mcq':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options *
              </label>
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={formData.options.length <= 2}
                    className="p-2 text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="mt-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Option
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Answer *
              </label>
              <select
                name="correctAnswer"
                value={formData.correctAnswer as string}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select correct answer</option>
                {formData.options.filter(opt => opt.trim()).map((option, index) => (
                  <option key={index} value={option}>
                    {String.fromCharCode(65 + index)}. {option}
                  </option>
                ))}
              </select>
              {errors.correctAnswer && (
                <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
              )}
            </div>
          </div>
        );

      case 'numerical':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correct Answer (Numerical Value) *
            </label>
            <input
              type="text"
              name="correctAnswer"
              value={formData.correctAnswer as string}
              onChange={handleInputChange}
              placeholder="e.g., 8, 3.14, -5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.correctAnswer && (
              <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
            )}
          </div>
        );

      case 'matrix_match':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Column I (Assertions)
              </label>
              <textarea
                name="columnI"
                placeholder="Enter Column I items, one per line"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Column II (Reasons)
              </label>
              <textarea
                name="columnII"
                placeholder="Enter Column II items, one per line"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Mappings *
              </label>
              <input
                type="text"
                name="correctAnswer"
                value={Array.isArray(formData.correctAnswer) ? formData.correctAnswer.join(', ') : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value.split(', ').filter(s => s.trim()) }))}
                placeholder="e.g., A-1, B-2, C-3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.correctAnswer && (
                <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
              )}
            </div>
          </div>
        );

      case 'assertion_reason':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correct Answer *
            </label>
            <select
              name="correctAnswer"
              value={formData.correctAnswer as string}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select correct answer</option>
              <option value="Both A and R are true and R is the correct explanation of A">
                Both A and R are true and R is the correct explanation of A
              </option>
              <option value="Both A and R are true but R is not the correct explanation of A">
                Both A and R are true but R is not the correct explanation of A
              </option>
              <option value="A is true but R is false">A is true but R is false</option>
              <option value="A is false but R is true">A is false but R is true</option>
              <option value="Both A and R are false">Both A and R are false</option>
            </select>
            {errors.correctAnswer && (
              <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Create Question</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/admin/questions" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Questions
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/admin/questions"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Questions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Question</h1>
          <p className="text-gray-600 mt-2">
            Add a new question to the question bank with detailed configuration.
          </p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Question Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Type *
                  </label>
                  <select
                    name="questionType"
                    value={formData.questionType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="mcq">Multiple Choice Question (MCQ)</option>
                    <option value="numerical">Numerical</option>
                    <option value="matrix_match">Matrix Match</option>
                    <option value="assertion_reason">Assertion-Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level *
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text *
              </label>
              <textarea
                name="questionText"
                value={formData.questionText}
                onChange={handleInputChange}
                rows={4}
                placeholder="Enter the question text here..."
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.questionText ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.questionText && (
                <p className="mt-1 text-sm text-red-600">{errors.questionText}</p>
              )}
            </div>

            {/* Subject Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.subject ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chapter *
                  </label>
                  <select
                    name="chapter"
                    value={formData.chapter}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.chapter ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={!formData.subject}
                  >
                    <option value="">{formData.subject ? 'Select Chapter' : 'Select Subject First'}</option>
                    {chapters.map((chapter) => (
                      <option key={chapter._id} value={chapter._id}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                  {errors.chapter && (
                    <p className="mt-1 text-sm text-red-600">{errors.chapter}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic *
                  </label>
                  <select
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.topic ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={!formData.chapter}
                  >
                    <option value="">{formData.chapter ? 'Select Topic' : 'Select Chapter First'}</option>
                    {topics.map((topic) => (
                      <option key={topic._id} value={topic._id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                  {errors.topic && (
                    <p className="mt-1 text-sm text-red-600">{errors.topic}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Scoring */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Scoring</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marks *
                  </label>
                  <input
                    type="number"
                    name="marks"
                    value={formData.marks}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.marks ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.marks && (
                    <p className="mt-1 text-sm text-red-600">{errors.marks}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Negative Marks
                  </label>
                  <input
                    type="number"
                    name="negativeMarks"
                    value={formData.negativeMarks}
                    onChange={handleInputChange}
                    min="0"
                    step="0.25"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.negativeMarks ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.negativeMarks && (
                    <p className="mt-1 text-sm text-red-600">{errors.negativeMarks}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Answer Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Answer Configuration</h3>
              {renderQuestionTypeForm()}
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation *
              </label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleInputChange}
                rows={3}
                placeholder="Provide a detailed explanation of the correct answer..."
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.explanation ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.explanation && (
                <p className="mt-1 text-sm text-red-600">{errors.explanation}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                />
                <button
                  type="button"
                  onClick={handleTagAdd}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Question is active and available for use
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
              >
                {showPreview ? <EyeSlashIcon className="h-4 w-4 mr-2" /> : <EyeIcon className="h-4 w-4 mr-2" />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <Link
                href="/admin/questions"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Question'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Preview */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-lg shadow-sm border p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Question Preview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {formData.questionType.toUpperCase()}
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {formData.difficulty}
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {formData.subject}
                  </span>
                </div>
                <p className="text-gray-900">{formData.questionText}</p>
              </div>
              
              {formData.questionType === 'mcq' && (
                <div className="space-y-2">
                  {formData.options.filter(opt => opt.trim()).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input type="radio" name="preview" disabled />
                      <span className="text-sm text-gray-700">
                        {String.fromCharCode(65 + index)}. {option}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                <p>Marks: {formData.marks} | Negative: {formData.negativeMarks}</p>
                <p>Chapter: {formData.chapter} | Topic: {formData.topic}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 