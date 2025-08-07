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
import QuestionForm from '../../../components/QuestionForm';

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
  questionType: 'MCQ_Single' | 'MCQ_Multiple' | 'TrueFalse' | 'Integer' | 'Numerical';
  subject: string;
  chapter: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
  options: string[];
  correctAnswer: string | string[] | number | boolean;
  explanation: string;
  questionImages: any[];
  optionImages: any[];
  explanationImages: any[];
  tags: string[];
  isActive: boolean;
}

interface QuestionFormErrors {
  questionText?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  marksPerQuestion?: string;
  negativeMarksPerQuestion?: string;
  options?: string;
  correctAnswer?: string;
  explanation?: string;
}

export default function CreateQuestion() {
  const router = useRouter();
  const [formData, setFormData] = useState<QuestionForm>({
    questionText: '',
    questionType: 'MCQ_Single',
    subject: '',
    chapter: '',
    topic: '',
    difficulty: 'Medium',
    marksPerQuestion: 4,
    negativeMarksPerQuestion: 1,
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    questionImages: [],
    optionImages: [],
    explanationImages: [],
    tags: [],
    isActive: true
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
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
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/');
      return;
    }

    loadSubjects();
  }, [router]);

  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/subjects?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data.docs || data.data || []);
      } else {
        console.error('Failed to load subjects');
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadChapters = async (subjectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/chapters?subjectId=${subjectId}&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChapters(data.data.docs || data.data || []);
      } else {
        console.error('Failed to load chapters');
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const loadTopics = async (chapterId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/topics?chapterId=${chapterId}&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTopics(data.data.docs || data.data || []);
      } else {
        console.error('Failed to load topics');
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'subject') {
      setFormData(prev => ({ ...prev, chapter: '', topic: '' }));
      setChapters([]);
      setTopics([]);
      if (value) {
        loadChapters(value);
      }
    } else if (name === 'chapter') {
      setFormData(prev => ({ ...prev, topic: '' }));
      setTopics([]);
      if (value) {
        loadTopics(value);
      }
    }
    
    if (errors[name as keyof QuestionFormErrors]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: QuestionFormErrors = {};

    if (!formData.questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    }

    if (!formData.subject) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.chapter) {
      newErrors.chapter = 'Chapter is required';
    }

    if (!formData.topic) {
      newErrors.topic = 'Topic is required';
    }

    if (formData.marksPerQuestion < 0) {
      newErrors.marksPerQuestion = 'Marks must be non-negative';
    }

    if (formData.negativeMarksPerQuestion < 0) {
      newErrors.negativeMarksPerQuestion = 'Negative marks must be non-negative';
    }

    // Validate based on question type
    if (formData.questionType === 'MCQ_Single' || formData.questionType === 'MCQ_Multiple') {
      if (!formData.options || formData.options.length < 2) {
        newErrors.options = 'At least 2 options are required';
      } else if (formData.options.some(option => !option.trim())) {
        newErrors.options = 'All options must be filled';
      }
    }

    if (!formData.correctAnswer || 
        (Array.isArray(formData.correctAnswer) && formData.correctAnswer.length === 0)) {
      newErrors.correctAnswer = 'Correct answer is required';
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
      // Get the selected subject, chapter, and topic names
      const selectedSubject = subjects.find(s => s._id === formData.subject);
      const selectedChapter = chapters.find(c => c._id === formData.chapter);
      const selectedTopic = topics.find(t => t._id === formData.topic);

      const payload = {
        questionText: formData.questionText,
        questionType: formData.questionType,
        subject: selectedSubject?.name || '',
        chapter: selectedChapter?.name || '',
        topic: selectedTopic?.name || '',
        difficulty: formData.difficulty,
        marksPerQuestion: formData.marksPerQuestion,
        negativeMarksPerQuestion: formData.negativeMarksPerQuestion,
        options: formData.options,
        correctAnswer: formData.correctAnswer,
        explanation: formData.explanation,
        questionImages: formData.questionImages,
        optionImages: formData.optionImages,
        explanationImages: formData.explanationImages,
        tags: formData.tags,
        isActive: formData.isActive
      };

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Question created successfully!');
        router.push('/admin/questions');
      } else {
        const errorData = await response.json();
        alert(`Failed to create question: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Question</h1>
                <p className="text-sm text-gray-500">Add a new question to the database</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-sm border"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Question Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Subject, Chapter, Topic Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter *
                </label>
                <select
                  name="chapter"
                  value={formData.chapter}
                  onChange={handleInputChange}
                  disabled={!formData.subject}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select Chapter</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic *
                </label>
                <select
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  disabled={!formData.chapter}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select Topic</option>
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

            {/* Question Form Component */}
            <QuestionForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              loading={loading}
            />

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin/questions"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Question'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 