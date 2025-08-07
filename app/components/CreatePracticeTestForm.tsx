'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  XMarkIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import QuestionForm from './QuestionForm';

interface CreatePracticeTestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

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
  questionImages?: any[];
  optionImages?: any[];
  explanationImages?: any[];
  tags?: string[];
  isActive: boolean;
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
  QuestionImageUrl?: string;
  Option1ImageUrl?: string;
  Option2ImageUrl?: string;
  Option3ImageUrl?: string;
  Option4ImageUrl?: string;
  ExplanationImageUrl?: string;
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

export default function CreatePracticeTestForm({ isOpen, onClose, onSubmit }: CreatePracticeTestFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'practice',
    level: 'Beginner',
    duration: 60,
    totalQuestions: 0,
    passingScore: 40,
    isActive: true
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    _id: '',
    questionText: '',
    questionType: 'MCQ_Single',
    subject: '',
    chapter: '',
    topic: '',
    difficulty: 'Medium',
    options: ['', '', '', ''],
    correctAnswer: '',
    marksPerQuestion: 4,
    negativeMarksPerQuestion: 1,
    explanation: '',
    questionImages: [],
    optionImages: [],
    explanationImages: [],
    tags: [],
    isActive: true
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [errors, setErrors] = useState<QuestionFormErrors>({});

  const testTypes = [
    { value: 'practice', label: 'Practice Test' },
    { value: 'mock', label: 'Mock Test' },
    { value: 'assessment', label: 'Assessment' }
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  useEffect(() => {
    if (isOpen) {
      fetchSubjectsAndCategories();
    }
  }, [isOpen]);

  const fetchSubjectsAndCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const [subjectsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/subjects?limit=1000', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.data.docs || subjectsData.data || []);
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        // Categories are used for other purposes, not for questions
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const loadChapters = async (subjectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chapters?subjectId=${subjectId}&limit=1000`, {
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
      const response = await fetch(`/api/topics?chapterId=${chapterId}&limit=1000`, {
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

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleQuestionInputChange = (field: string, value: any) => {
    setCurrentQuestion({ ...currentQuestion, [field]: value });
    
    if (field === 'subject') {
      setCurrentQuestion(prev => ({ ...prev, chapter: '', topic: '' }));
      setChapters([]);
      setTopics([]);
      if (value) {
        loadChapters(value);
      }
    } else if (field === 'chapter') {
      setCurrentQuestion(prev => ({ ...prev, topic: '' }));
      setTopics([]);
      if (value) {
        loadTopics(value);
      }
    }
    
    if (errors[field as keyof QuestionFormErrors]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateQuestion = (): boolean => {
    const newErrors: QuestionFormErrors = {};

    if (!currentQuestion.questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    }

    if (!currentQuestion.subject) {
      newErrors.subject = 'Subject is required';
    }

    if (!currentQuestion.chapter) {
      newErrors.chapter = 'Chapter is required';
    }

    if (!currentQuestion.topic) {
      newErrors.topic = 'Topic is required';
    }

    if (currentQuestion.marksPerQuestion < 0) {
      newErrors.marksPerQuestion = 'Marks must be non-negative';
    }

    if (currentQuestion.negativeMarksPerQuestion && currentQuestion.negativeMarksPerQuestion < 0) {
      newErrors.negativeMarksPerQuestion = 'Negative marks must be non-negative';
    }

    // Validate based on question type
    if (currentQuestion.questionType === 'MCQ_Single' || currentQuestion.questionType === 'MCQ_Multiple') {
      if (!currentQuestion.options || currentQuestion.options.length < 2) {
        newErrors.options = 'At least 2 options are required';
      } else if (currentQuestion.options.some(option => !option.trim())) {
        newErrors.options = 'All options must be filled';
      }
    }

    if (!currentQuestion.correctAnswer || 
        (Array.isArray(currentQuestion.correctAnswer) && currentQuestion.correctAnswer.length === 0)) {
      newErrors.correctAnswer = 'Correct answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addQuestion = () => {
    if (!validateQuestion()) {
      return;
    }

    // Get the selected subject, chapter, and topic names
    const selectedSubject = subjects.find(s => s._id === currentQuestion.subject);
    const selectedChapter = chapters.find(c => c._id === currentQuestion.chapter);
    const selectedTopic = topics.find(t => t._id === currentQuestion.topic);

    const newQuestion: Question = {
      ...currentQuestion,
      _id: Date.now().toString(),
      subject: selectedSubject?.name || '',
      chapter: selectedChapter?.name || '',
      topic: selectedTopic?.name || ''
    };

    setQuestions(prev => [...prev, newQuestion]);
    setCurrentQuestion({
      _id: '',
      questionText: '',
      questionType: 'MCQ_Single',
      subject: '',
      chapter: '',
      topic: '',
      difficulty: 'Medium',
      options: ['', '', '', ''],
      correctAnswer: '',
      marksPerQuestion: 4,
      negativeMarksPerQuestion: 1,
      explanation: '',
      questionImages: [],
      optionImages: [],
      explanationImages: [],
      tags: [],
      isActive: true
    });
    setShowQuestionForm(false);
    setErrors({});
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q._id !== id));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processCSVFile(file);
    }
  };

  const processCSVFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const csvQuestions: CSVQuestion[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const question: any = {};
        
        headers.forEach((header, index) => {
          question[header] = values[index] || '';
        });
        
        csvQuestions.push(question);
      }
    }

    const processedQuestions: Question[] = csvQuestions.map((csvQ, index) => {
      // Create image data for question images
      const questionImages = csvQ.QuestionImageUrl ? [{
        url: csvQ.QuestionImageUrl,
        key: `question_${index}`,
        caption: '',
        alt: `Question ${index + 1}`
      }] : [];

      // Create image data for option images
      const optionImages = [];
      if (csvQ.Option1ImageUrl) {
        optionImages.push({
          url: csvQ.Option1ImageUrl,
          key: `option1_${index}`,
          caption: '',
          alt: `Option 1`,
          optionIndex: 0
        });
      }
      if (csvQ.Option2ImageUrl) {
        optionImages.push({
          url: csvQ.Option2ImageUrl,
          key: `option2_${index}`,
          caption: '',
          alt: `Option 2`,
          optionIndex: 1
        });
      }
      if (csvQ.Option3ImageUrl) {
        optionImages.push({
          url: csvQ.Option3ImageUrl,
          key: `option3_${index}`,
          caption: '',
          alt: `Option 3`,
          optionIndex: 2
        });
      }
      if (csvQ.Option4ImageUrl) {
        optionImages.push({
          url: csvQ.Option4ImageUrl,
          key: `option4_${index}`,
          caption: '',
          alt: `Option 4`,
          optionIndex: 3
        });
      }

      // Create image data for explanation images
      const explanationImages = csvQ.ExplanationImageUrl ? [{
        url: csvQ.ExplanationImageUrl,
        key: `explanation_${index}`,
        caption: '',
        alt: `Explanation ${index + 1}`
      }] : [];

      return {
        _id: Date.now().toString() + index,
        questionText: csvQ.QuestionText,
        questionType: csvQ.QuestionType as any,
        subject: csvQ.Subject,
        chapter: '',
        topic: csvQ.Topic,
        difficulty: csvQ.Difficulty as any,
        options: [csvQ.Option1 || '', csvQ.Option2 || '', csvQ.Option3 || '', csvQ.Option4 || ''].filter(Boolean),
        correctAnswer: csvQ.CorrectAnswer,
        marksPerQuestion: parseFloat(csvQ.MarksPerQuestion) || 4,
        negativeMarksPerQuestion: parseFloat(csvQ.NegativeMarksPerQuestion) || 1,
        explanation: csvQ.Explanation,
        questionImages,
        optionImages,
        explanationImages,
        tags: csvQ.Tags ? csvQ.Tags.split(',').map(tag => tag.trim()) : [],
        isActive: true
      };
    });

    setQuestions(prev => [...prev, ...processedQuestions]);
    alert(`Imported ${processedQuestions.length} questions successfully!`);
  };

  const importCSVQuestions = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => handleFileSelect(e as any);
    input.click();
  };

  const downloadSampleCSV = () => {
    const csvContent = `QuestionNumber,QuestionText,QuestionType,Option1,Option2,Option3,Option4,CorrectAnswer,MarksPerQuestion,NegativeMarksPerQuestion,SectionId,Difficulty,Topic,Subject,Explanation,Tags,QuestionImageUrl,Option1ImageUrl,Option2ImageUrl,Option3ImageUrl,Option4ImageUrl,ExplanationImageUrl
1,What is the capital of France?,MCQ_Single,Paris,London,Berlin,Madrid,Paris,4,1,1,Medium,Geography,Geography,Paris is the capital and largest city of France.,geography,capital,https://example.com/paris.jpg,https://example.com/option1.jpg,https://example.com/option2.jpg,https://example.com/option3.jpg,https://example.com/option4.jpg,https://example.com/explanation.jpg
2,Which of the following are programming languages?,MCQ_Multiple,Python,Java,HTML,CSS,"Python,Java",4,1,1,Medium,Programming,Computer Science,Python and Java are programming languages. HTML and CSS are markup languages.,programming,languages,https://example.com/programming.jpg,https://example.com/option1.jpg,https://example.com/option2.jpg,https://example.com/option3.jpg,https://example.com/option4.jpg,https://example.com/explanation.jpg`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-questions-with-images.csv';
    a.click();
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
        totalMarks: questions.reduce((sum, q) => sum + q.marksPerQuestion, 0)
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
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Download Sample CSV
                </button>
                <button
                  onClick={importCSVQuestions}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Import CSV
                </button>
                <button
                  onClick={() => setShowQuestionForm(true)}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Question
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={question._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {question.questionText.substring(0, 100)}...
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">{question.questionType}</span>
                          <span className="text-xs text-gray-500">{question.marksPerQuestion} marks</span>
                          <span className="text-xs text-gray-500">{question.subject}</span>
                          {question.questionImages && question.questionImages.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Has Images</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeQuestion(question._id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Practice Test'}
            </button>
          </div>
        </div>

        {/* Question Form Modal */}
        {showQuestionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {/* Question Form Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Add Question</h2>
                </div>
                <button
                  onClick={() => setShowQuestionForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Subject, Chapter, Topic Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      value={currentQuestion.subject}
                      onChange={(e) => handleQuestionInputChange('subject', e.target.value)}
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
                      value={currentQuestion.chapter}
                      onChange={(e) => handleQuestionInputChange('chapter', e.target.value)}
                      disabled={!currentQuestion.subject}
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
                      value={currentQuestion.topic}
                      onChange={(e) => handleQuestionInputChange('topic', e.target.value)}
                      disabled={!currentQuestion.chapter}
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
                  formData={currentQuestion}
                  setFormData={setCurrentQuestion}
                  errors={errors}
                  setErrors={setErrors}
                  loading={loading}
                />

                {/* Question Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowQuestionForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addQuestion}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Question'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
} 