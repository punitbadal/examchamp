'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  AcademicCapIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Subject {
  _id: string;
  name: string;
  description?: string;
}

interface Chapter {
  _id: string;
  name: string;
  code: string;
  chapterNumber: number;
  subjectId: string;
}

interface Exam {
  _id: string;
  title: string;
  examCode: string;
  description: string;
  examType: 'live' | 'practice' | 'mock';
  totalDuration: number;
  totalMarks: number;
  sections: any[];
}

interface PracticeTestSection {
  id: string;
  name: string;
  subject: string;
  totalMarks: number;
  questions: any[];
  instructions: string;
  markingScheme: {
    correctMarks: number;
    incorrectMarks: number;
    noAttemptMarks: number;
  };
}

interface Question {
  id: string;
  questionText: string;
  questionType: 'mcq' | 'numerical' | 'matrix_match' | 'assertion_reason';
  subject: string;
  chapter: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  tags: string[];
}

const CreatePracticeTestPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [newQuestionData, setNewQuestionData] = useState<any>({
    questionText: '',
    questionType: 'mcq',
    subject: '',
    chapter: '',
    topic: '',
    difficulty: 'medium',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    tags: []
  });
  const [newQuestionErrors, setNewQuestionErrors] = useState<any>({});

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    type: 'chapter_test' as 'chapter_test' | 'subject_test',
    level: 'Intermediate' as const,
    status: 'draft' as const,
    subjects: [] as string[],
    chapters: [] as string[],
    exams: [] as string[],
    topics: [] as string[],
    sections: [] as PracticeTestSection[],
    tags: [] as string[],
    instructions: '',
    settings: {
      timeLimit: 60,
      passingScore: 60,
      maxAttempts: 3,
      showTimer: true,
      showProgress: true,
      allowReview: true,
      allowMarkForReview: true,
      allowBackNavigation: true,
      autoSubmit: true,
      showResultsImmediately: true,
      showCorrectAnswers: false,
      showExplanations: false,
      allowCalculator: false,
      allowScratchpad: true,
      allowHighlighter: true
    },
    mode: 'random' as const,
    adaptiveSettings: {
      initialDifficulty: 'medium' as const,
      difficultyAdjustment: 0.5,
      minQuestionsPerDifficulty: 2
    },
    weights: {
      byDifficulty: {
        easy: 1,
        medium: 1,
        hard: 1
      },
      byTopic: []
    },
    questionSelection: {
      mode: 'random' as const,
      adaptiveSettings: {
        initialDifficulty: 'medium' as const,
        difficultyAdjustment: 0.5,
        minQuestionsPerDifficulty: 2
      },
      weights: {
        byDifficulty: {
          easy: 1,
          medium: 1,
          hard: 1
        },
        byTopic: []
      }
    },
    access: {
      isPublic: true,
      isPaid: false,
      price: 0,
      currency: 'INR' as const,
      allowedRoles: ['student'],
      enrollmentRequired: false,
      prerequisites: []
    },
    availability: {
      startDate: '',
      endDate: '',
      timeSlots: []
    }
  });

  useEffect(() => {
    fetchSubjects();
    fetchCategories();
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedSubject && formData.type === 'chapter_test') {
      fetchChapters(selectedSubject);
    }
  }, [selectedSubject, formData.type]);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subjects?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data?.docs || data.data || []);
      } else {
        console.error('Failed to fetch subjects');
        toast.error('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Error fetching subjects');
    }
  };

  const fetchChapters = async (subjectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chapters?subjectId=${subjectId}&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChapters(data.data?.docs || data.data || []);
      } else {
        console.error('Failed to fetch chapters');
        toast.error('Failed to fetch chapters');
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      toast.error('Error fetching chapters');
    }
  };

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/exams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      } else {
        console.error('Failed to fetch exams');
        toast.error('Failed to fetch exams');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Error fetching exams');
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        console.error('Failed to fetch categories');
        toast.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error fetching categories');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'type') {
      // Reset content scope when type changes
      setSelectedSubject('');
      setSelectedChapter('');
      setSelectedExam('');
      setFormData(prev => ({
        ...prev,
        subjects: [],
        chapters: [],
        exams: [],
        topics: []
      }));
    }

    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as any || {}),
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name.includes('settings.')) {
      const field = name.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name.includes('questionSelection.')) {
      const field = name.replace('questionSelection.', '');
      setFormData(prev => ({
        ...prev,
        questionSelection: {
          ...prev.questionSelection,
          [field]: value
        }
      }));
    } else if (name.includes('access.')) {
      const field = name.replace('access.', '');
      setFormData(prev => ({
        ...prev,
        access: {
          ...prev.access,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name.includes('availability.')) {
      const field = name.replace('availability.', '');
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    if (name.includes('settings.')) {
      const field = name.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [field]: numValue
        }
      }));
    } else if (name.includes('questionSelection.adaptiveSettings.')) {
      const field = name.replace('questionSelection.adaptiveSettings.', '');
      setFormData(prev => ({
        ...prev,
        questionSelection: {
          ...prev.questionSelection,
          adaptiveSettings: {
            ...prev.questionSelection.adaptiveSettings,
            [field]: numValue
          }
        }
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addSubject = (subject: string) => {
    if (!formData.subjects.includes(subject)) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, subject]
      }));
    }
  };

  const removeSubject = (subjectToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(subject => subject !== subjectToRemove)
    }));
  };

  const addChapter = (chapter: string) => {
    if (!formData.chapters.includes(chapter)) {
      setFormData(prev => ({
        ...prev,
        chapters: [...prev.chapters, chapter]
      }));
    }
  };

  const removeChapter = (chapterToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.filter(chapter => chapter !== chapterToRemove)
    }));
  };

  const addExam = (exam: string) => {
    if (!formData.exams.includes(exam)) {
      setFormData(prev => ({
        ...prev,
        exams: [...prev.exams, exam]
      }));
    }
  };

  const removeExam = (examToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      exams: prev.exams.filter(exam => exam !== examToRemove)
    }));
  };

  const addTopic = (topic: string) => {
    if (!formData.topics.includes(topic)) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, topic]
      }));
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };

  const addSection = () => {
    const newSection: PracticeTestSection = {
      id: Date.now().toString(),
      name: `Section ${formData.sections.length + 1}`,
      subject: '',
      totalMarks: 100,
      questions: [],
      instructions: '',
      markingScheme: {
        correctMarks: 4,
        incorrectMarks: -1,
        noAttemptMarks: 0
      }
    };
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<PracticeTestSection>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const removeSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const addQuestionToSection = (sectionId: string, question: Question) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, questions: [...section.questions, question] }
          : section
      )
    }));
  };

  const removeQuestionFromSection = (sectionId: string, questionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, questions: section.questions.filter(q => q.id !== questionId) }
          : section
      )
    }));
  };

  const handleCreateQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newQuestionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create question');
      }

      const result = await response.json();
      
      // Add the newly created question to the selected section
      if (selectedSectionId) {
        const newQuestion: Question = {
          id: result.question._id,
          questionText: newQuestionData.questionText,
          questionType: newQuestionData.questionType === 'MCQ_Single' || newQuestionData.questionType === 'MCQ_Multiple' ? 'mcq' : 'numerical',
          subject: newQuestionData.subject,
          chapter: newQuestionData.chapter,
          topic: newQuestionData.topic,
          difficulty: newQuestionData.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
          options: newQuestionData.options,
          correctAnswer: newQuestionData.correctAnswer,
          explanation: newQuestionData.explanation,
          tags: newQuestionData.tags
        };

        addQuestionToSection(selectedSectionId, newQuestion);
        
        // Reset form
        setNewQuestionData({
          questionText: '',
          questionType: 'mcq',
          subject: '',
          chapter: '',
          topic: '',
          difficulty: 'medium',
          options: ['', '', '', ''],
          correctAnswer: '',
          explanation: '',
          tags: []
        });
        setNewQuestionErrors({});
        setShowCreateQuestionModal(false);
        setSelectedSectionId('');
      }
    } catch (error: any) {
      console.error('Error creating question:', error);
      setNewQuestionErrors({ general: error.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/practice-tests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Practice test created successfully!');
        router.push('/admin/practice-tests');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create practice test');
      }
    } catch (error) {
      console.error('Error creating practice test:', error);
      toast.error('Error creating practice test');
    } finally {
      setLoading(false);
    }
  };

  const renderContentScope = () => {
    switch (formData.type) {
      case 'chapter_test':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Select Subject and Chapters</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose a subject and its chapters for this practice test. You can create sections for the selected subject.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Subject *
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  if (e.target.value) {
                    setSelectedSubjects([e.target.value]);
                  } else {
                    setSelectedSubjects([]);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a subject</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedSubject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Chapter(s) *
                </label>
                <select
                  value={selectedChapter}
                  onChange={(e) => {
                    if (e.target.value) {
                      addChapter(e.target.value);
                      setSelectedChapter('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose chapters</option>
                  {chapters.map((chapter) => (
                    <option key={chapter._id} value={chapter._id}>
                      {chapter.chapterNumber}. {chapter.name}
                    </option>
                  ))}
                </select>
                
                {formData.chapters.length > 0 && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Chapters:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.chapters.map((chapterId) => {
                        const chapter = chapters.find(c => c._id === chapterId);
                        return chapter ? (
                          <span
                            key={chapterId}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {chapter.chapterNumber}. {chapter.name}
                            <button
                              type="button"
                              onClick={() => removeChapter(chapterId)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'subject_test':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Select Subjects</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose the subjects that will be included in this practice test. You can create sections for each selected subject.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <div key={subject._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`subject-${subject._id}`}
                    checked={selectedSubjects.includes(subject._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubjects([...selectedSubjects, subject._id]);
                      } else {
                        setSelectedSubjects(selectedSubjects.filter(id => id !== subject._id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`subject-${subject._id}`} className="ml-2 text-sm font-medium text-gray-900">
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
            
            {selectedSubjects.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                Please select at least one subject to continue.
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-2xl font-bold text-gray-900">Create Practice Test</h1>
                <p className="text-gray-600">Configure a new practice test with questions and settings</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <DocumentTextIcon className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter test title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., PT001"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the practice test"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="chapter_test">Chapter Test</option>
                  <option value="subject_test">Subject Test</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content Scope */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <AcademicCapIcon className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Content Scope</h2>
            </div>

            {renderContentScope()}
          </div>

          {/* Sections */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <AcademicCapIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Test Sections</h2>
              </div>
              <button
                type="button"
                onClick={addSection}
                disabled={selectedSubjects.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Section
              </button>
            </div>
            
            {selectedSubjects.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Please select subjects in the Content Scope to create sections.</p>
              </div>
            )}

            {formData.sections.map((section, index) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-md font-medium text-gray-900">Section {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section Name
                    </label>
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => updateSection(section.id, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Physics Section 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={section.subject}
                      onChange={(e) => updateSection(section.id, { subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Subject</option>
                      {subjects
                        .filter(subject => selectedSubjects.includes(subject._id))
                        .map(subject => (
                          <option key={subject._id} value={subject.name}>
                            {subject.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      value={section.totalMarks}
                      onChange={(e) => updateSection(section.id, { totalMarks: parseInt(e.target.value) })}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Marking Scheme */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Marking Scheme</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correct Answer Marks
                      </label>
                      <input
                        type="number"
                        value={section.markingScheme.correctMarks}
                        onChange={(e) => updateSection(section.id, { 
                          markingScheme: { 
                            ...section.markingScheme, 
                            correctMarks: parseInt(e.target.value) 
                          } 
                        })}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Incorrect Answer Marks
                      </label>
                      <input
                        type="number"
                        value={section.markingScheme.incorrectMarks}
                        onChange={(e) => updateSection(section.id, { 
                          markingScheme: { 
                            ...section.markingScheme, 
                            incorrectMarks: parseInt(e.target.value) 
                          } 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        No Attempt Marks
                      </label>
                      <input
                        type="number"
                        value={section.markingScheme.noAttemptMarks}
                        onChange={(e) => updateSection(section.id, { 
                          markingScheme: { 
                            ...section.markingScheme, 
                            noAttemptMarks: parseInt(e.target.value) 
                          } 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Questions */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium text-gray-900">Questions ({section.questions.length})</h5>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSectionId(section.id);
                        setShowCreateQuestionModal(true);
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Add Question
                    </button>
                  </div>
                  
                  {section.questions.length > 0 ? (
                    <div className="space-y-2">
                      {section.questions.map((question, qIndex) => (
                        <div key={question.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">
                            Q{qIndex + 1}: {question.questionText.substring(0, 50)}...
                          </span>
                          <button
                            type="button"
                            onClick={() => removeQuestionFromSection(section.id, question.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No questions added yet.</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    value={section.instructions}
                    onChange={(e) => updateSection(section.id, { instructions: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Section-specific instructions..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Test Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <CogIcon className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Test Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (minutes) *
                </label>
                <input
                  type="number"
                  name="settings.timeLimit"
                  value={formData.settings.timeLimit}
                  onChange={handleNumberInputChange}
                  min="5"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  name="settings.passingScore"
                  value={formData.settings.passingScore}
                  onChange={handleNumberInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attempts
                </label>
                <input
                  type="number"
                  name="settings.maxAttempts"
                  value={formData.settings.maxAttempts}
                  onChange={handleNumberInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Access Control */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <CurrencyDollarIcon className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Access Control</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="access.isPublic"
                  checked={formData.access.isPublic}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Public Test
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="access.isPaid"
                  checked={formData.access.isPaid}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Paid Test
                </label>
              </div>

              {formData.access.isPaid && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    name="access.price"
                    value={formData.access.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <TagIcon className="w-6 h-6 text-indigo-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tags to help categorize this test"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <DocumentTextIcon className="w-6 h-6 text-gray-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Instructions</h2>
            </div>

            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter instructions for students taking this test"
            />
          </div>

          {/* Question Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <AcademicCapIcon className="w-6 h-6 text-indigo-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Question Management</h2>
              </div>
              <div className="text-sm text-gray-500">
                Questions will be added after test creation
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    How Questions Are Added
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p className="mb-2">
                      <strong>Step 1:</strong> Create the practice test structure above (this form)
                    </p>
                    <p className="mb-2">
                      <strong>Step 2:</strong> After creation, you'll be redirected to the practice test management page
                    </p>
                    <p className="mb-2">
                      <strong>Step 3:</strong> Use the "Add Questions" button to:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Add individual questions manually</li>
                      <li>Import questions from CSV files</li>
                      <li>Select questions from existing question bank</li>
                      <li>Auto-generate questions based on content scope</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Current Flow (This Page)</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Create test structure and settings</li>
                  <li>• Define content scope (subjects/chapters/exams)</li>
                  <li>• Configure test parameters</li>
                  <li>• Set access controls</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-800 mb-2">Alternative Flow (Content Page)</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Create test + add questions in one step</li>
                  <li>• Use the "Create Test" button in Content Management</li>
                  <li>• Includes question form integration</li>
                  <li>• Better for quick test creation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Practice Test'}
            </button>
          </div>
        </form>

        {/* Create Question Modal */}
        {showCreateQuestionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Create New Question</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateQuestionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text *
                  </label>
                  <textarea
                    value={newQuestionData.questionText}
                    onChange={(e) => setNewQuestionData({...newQuestionData, questionText: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your question here..."
                  />
                  {newQuestionErrors.questionText && (
                    <p className="mt-1 text-sm text-red-600">{newQuestionErrors.questionText}</p>
                  )}
                </div>

                {/* Question Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type *
                  </label>
                  <select
                    value={newQuestionData.questionType}
                    onChange={(e) => setNewQuestionData({...newQuestionData, questionType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="mcq">Multiple Choice (Single Answer)</option>
                    <option value="numerical">Numerical</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={newQuestionData.subject}
                    onChange={(e) => setNewQuestionData({...newQuestionData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chapter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapter *
                  </label>
                  <select
                    value={newQuestionData.chapter}
                    onChange={(e) => setNewQuestionData({...newQuestionData, chapter: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map((chapter) => (
                      <option key={chapter._id} value={chapter.name}>
                        {chapter.chapterNumber}. {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty *
                  </label>
                  <select
                    value={newQuestionData.difficulty}
                    onChange={(e) => setNewQuestionData({...newQuestionData, difficulty: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Options for MCQ */}
                {newQuestionData.questionType === 'mcq' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options *
                    </label>
                    {newQuestionData.options.map((option: string, index: number) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestionData.options];
                            newOptions[index] = e.target.value;
                            setNewQuestionData({...newQuestionData, options: newOptions});
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Correct Answer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer *
                  </label>
                  <input
                    type="text"
                    value={newQuestionData.correctAnswer}
                    onChange={(e) => setNewQuestionData({...newQuestionData, correctAnswer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter correct answer"
                  />
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation
                  </label>
                  <textarea
                    value={newQuestionData.explanation}
                    onChange={(e) => setNewQuestionData({...newQuestionData, explanation: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Explain the solution..."
                  />
                </div>

                {newQuestionErrors.general && (
                  <div className="text-red-600 text-sm">{newQuestionErrors.general}</div>
                )}

                {/* Modal Actions */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateQuestionModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateQuestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Question
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePracticeTestPage; 