'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  AcademicCapIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  questionText: string;
  questionType: 'mcq' | 'numerical' | 'matrix_match' | 'assertion_reason';
  subject: string;
  chapter: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  tags: string[];
}

interface ExamSection {
  id: string;
  name: string;
  subject: string;
  duration: number; // in minutes
  totalMarks: number;
  questions: Question[];
  instructions: string;
}

interface ExamForm {
  title: string;
  examCode: string;
  description: string;
  examType: 'live' | 'practice' | 'mock';
  template: 'jee_main' | 'neet' | 'cat' | 'upsc' | 'custom';
  totalDuration: number;
  totalMarks: number;
  sections: ExamSection[];
  startTime: string;
  endTime: string;
  maxAttempts: number;
  passingScore: number;
  isActive: boolean;
  proctoringEnabled: boolean;
  webcamRequired: boolean;
  screenRecording: boolean;
  tabSwitchingDetection: boolean;
  instructions: string;
  negativeMarking: boolean;
  partialCredit: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
}

interface ExamFormErrors {
  title?: string;
  examCode?: string;
  description?: string;
  totalDuration?: string;
  totalMarks?: string;
  sections?: string;
  startTime?: string;
  endTime?: string;
}

export default function CreateExam() {
  const router = useRouter();
  const [formData, setFormData] = useState<ExamForm>({
    title: '',
    examCode: '',
    description: '',
    examType: 'live',
    template: 'custom',
    totalDuration: 180,
    totalMarks: 300,
    sections: [],
    startTime: '',
    endTime: '',
    maxAttempts: 1,
    passingScore: 150,
    isActive: true,
    proctoringEnabled: false,
    webcamRequired: false,
    screenRecording: false,
    tabSwitchingDetection: false,
    instructions: '',
    negativeMarking: true,
    partialCredit: false,
    randomizeQuestions: false,
    randomizeOptions: false
  });
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ExamFormErrors>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'sections' | 'questions' | 'settings' | 'proctoring'>('basic');

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
      
      loadQuestions();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/');
    }
  }, [router]);

  const loadQuestions = async () => {
    try {
      // Mock questions data
      const mockQuestions: Question[] = [
        {
          id: '1',
          questionText: 'A particle moves along a straight line with velocity v = 3t² - 6t + 2 m/s. The acceleration of the particle at t = 2s is:',
          questionType: 'mcq',
          subject: 'Physics',
          chapter: 'Kinematics',
          topic: 'Motion in One Dimension',
          difficulty: 'medium',
          marks: 4,
          negativeMarks: 1,
          options: ['6 m/s²', '8 m/s²', '10 m/s²', '12 m/s²'],
          correctAnswer: '6 m/s²',
          explanation: 'Acceleration is the derivative of velocity.',
          tags: ['kinematics', 'derivatives']
        },
        {
          id: '2',
          questionText: 'The value of ∫(x² + 2x + 1)dx from 0 to 2 is:',
          questionType: 'numerical',
          subject: 'Mathematics',
          chapter: 'Calculus',
          topic: 'Integration',
          difficulty: 'easy',
          marks: 3,
          negativeMarks: 0,
          correctAnswer: '8',
          explanation: '∫(x² + 2x + 1)dx = (x³/3 + x² + x) from 0 to 2 = 8',
          tags: ['calculus', 'integration']
        },
        {
          id: '3',
          questionText: 'Match the following:\nColumn I: A) HCl B) H₂SO₄ C) HNO₃\nColumn II: 1) Monobasic 2) Dibasic 3) Tribasic',
          questionType: 'matrix_match',
          subject: 'Chemistry',
          chapter: 'Acids and Bases',
          topic: 'Types of Acids',
          difficulty: 'medium',
          marks: 4,
          negativeMarks: 1,
          correctAnswer: ['A-1', 'B-2', 'C-1'],
          explanation: 'HCl is monobasic, H₂SO₄ is dibasic, HNO₃ is monobasic',
          tags: ['acids', 'basicity']
        }
      ];

      setAvailableQuestions(mockQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof ExamFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleTemplateChange = (template: string) => {
    const templates = {
      jee_main: {
        title: 'JEE Main Mock Test',
        totalDuration: 180,
        totalMarks: 300,
        sections: [
          { id: '1', name: 'Physics', subject: 'Physics', duration: 60, totalMarks: 100, questions: [], instructions: 'Physics section with 25 questions' },
          { id: '2', name: 'Chemistry', subject: 'Chemistry', duration: 60, totalMarks: 100, questions: [], instructions: 'Chemistry section with 25 questions' },
          { id: '3', name: 'Mathematics', subject: 'Mathematics', duration: 60, totalMarks: 100, questions: [], instructions: 'Mathematics section with 25 questions' }
        ]
      },
      neet: {
        title: 'NEET Mock Test',
        totalDuration: 200,
        totalMarks: 720,
        sections: [
          { id: '1', name: 'Physics', subject: 'Physics', duration: 50, totalMarks: 180, questions: [], instructions: 'Physics section with 45 questions' },
          { id: '2', name: 'Chemistry', subject: 'Chemistry', duration: 50, totalMarks: 180, questions: [], instructions: 'Chemistry section with 45 questions' },
          { id: '3', name: 'Biology', subject: 'Biology', duration: 100, totalMarks: 360, questions: [], instructions: 'Biology section with 90 questions' }
        ]
      },
      cat: {
        title: 'CAT Mock Test',
        totalDuration: 180,
        totalMarks: 300,
        sections: [
          { id: '1', name: 'Verbal Ability', subject: 'English', duration: 60, totalMarks: 100, questions: [], instructions: 'Verbal Ability section' },
          { id: '2', name: 'Data Interpretation', subject: 'Mathematics', duration: 60, totalMarks: 100, questions: [], instructions: 'Data Interpretation section' },
          { id: '3', name: 'Quantitative Aptitude', subject: 'Mathematics', duration: 60, totalMarks: 100, questions: [], instructions: 'Quantitative Aptitude section' }
        ]
      },
      upsc: {
        title: 'UPSC Prelims Mock',
        totalDuration: 120,
        totalMarks: 200,
        sections: [
          { id: '1', name: 'General Studies', subject: 'General Knowledge', duration: 120, totalMarks: 200, questions: [], instructions: 'General Studies section with 100 questions' }
        ]
      }
    };

    const selectedTemplate = templates[template as keyof typeof templates];
    if (selectedTemplate) {
      setFormData(prev => ({
        ...prev,
        template: template as ExamForm['template'],
        title: selectedTemplate.title,
        totalDuration: selectedTemplate.totalDuration,
        totalMarks: selectedTemplate.totalMarks,
        sections: selectedTemplate.sections
      }));
    }
  };

  const addSection = () => {
    const newSection: ExamSection = {
      id: Date.now().toString(),
      name: `Section ${formData.sections.length + 1}`,
      subject: '',
      duration: 30,
      totalMarks: 100,
      questions: [],
      instructions: ''
    };
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<ExamSection>) => {
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

  const validateForm = (): boolean => {
    const newErrors: ExamFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Exam title is required';
    }

    if (!formData.examCode.trim()) {
      newErrors.examCode = 'Exam code is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.totalDuration <= 0) {
      newErrors.totalDuration = 'Total duration must be greater than 0';
    }

    if (formData.totalMarks <= 0) {
      newErrors.totalMarks = 'Total marks must be greater than 0';
    }

    if (formData.sections.length === 0) {
      newErrors.sections = 'At least one section is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
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
      console.log('Creating exam with payload:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Exam created successfully!');
      router.push('/admin/exams');
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Error creating exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const totalSelectedQuestions = formData.sections.reduce((total, section) => total + section.questions.length, 0);
  const totalSelectedMarks = formData.sections.reduce((total, section) => total + section.questions.reduce((sum, q) => sum + q.marks, 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Create Exam</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/admin/exams" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Exams
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/admin/exams"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Exams
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Exam</h1>
          <p className="text-gray-600 mt-2">
            Build a comprehensive exam with sections, questions, and advanced settings.
          </p>
        </div>

        {/* Progress Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{formData.sections.length}</div>
              <div className="text-sm text-gray-600">Sections</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalSelectedQuestions}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{totalSelectedMarks}</div>
              <div className="text-sm text-gray-600">Total Marks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{formData.totalDuration}</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border"
        >
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'basic', name: 'Basic Info', icon: DocumentTextIcon },
                { id: 'sections', name: 'Sections', icon: AcademicCapIcon },
                { id: 'questions', name: 'Questions', icon: PlusIcon },
                { id: 'settings', name: 'Settings', icon: CogIcon },
                { id: 'proctoring', name: 'Proctoring', icon: EyeIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., JEE Main Mock Test 1"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Code *
                      </label>
                      <input
                        type="text"
                        name="examCode"
                        value={formData.examCode}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                          errors.examCode ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., JEE001"
                      />
                      {errors.examCode && (
                        <p className="mt-1 text-sm text-red-600">{errors.examCode}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        errors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Describe the exam purpose and content..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Exam Template</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'custom', name: 'Custom', desc: 'Build from scratch' },
                      { id: 'jee_main', name: 'JEE Main', desc: 'Engineering entrance' },
                      { id: 'neet', name: 'NEET', desc: 'Medical entrance' },
                      { id: 'cat', name: 'CAT', desc: 'Management entrance' },
                      { id: 'upsc', name: 'UPSC', desc: 'Civil services' }
                    ].map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateChange(template.id)}
                        className={`p-4 border rounded-lg text-left hover:border-blue-500 transition-colors ${
                          formData.template === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Exam Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Type
                      </label>
                      <select
                        name="examType"
                        value={formData.examType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="live">Live Exam</option>
                        <option value="practice">Practice Test</option>
                        <option value="mock">Mock Test</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        name="totalDuration"
                        value={formData.totalDuration}
                        onChange={handleInputChange}
                        min="1"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                          errors.totalDuration ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.totalDuration && (
                        <p className="mt-1 text-sm text-red-600">{errors.totalDuration}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Marks *
                      </label>
                      <input
                        type="number"
                        name="totalMarks"
                        value={formData.totalMarks}
                        onChange={handleInputChange}
                        min="1"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                          errors.totalMarks ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.totalMarks && (
                        <p className="mt-1 text-sm text-red-600">{errors.totalMarks}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="datetime-local"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                          errors.startTime ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.startTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time *
                      </label>
                      <input
                        type="datetime-local"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                          errors.endTime ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.endTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sections Tab */}
            {activeTab === 'sections' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Exam Sections</h3>
                  <button
                    type="button"
                    onClick={addSection}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Section
                  </button>
                </div>

                {formData.sections.map((section, index) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-md font-medium text-gray-900">Section {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
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
                          placeholder="e.g., Physics, Chemistry"
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
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Biology">Biology</option>
                          <option value="English">English</option>
                          <option value="General Knowledge">General Knowledge</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={section.duration}
                          onChange={(e) => updateSection(section.id, { duration: parseInt(e.target.value) })}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
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

                    <div className="mt-4 text-sm text-gray-600">
                      Questions: {section.questions.length} | Marks: {section.questions.reduce((sum, q) => sum + q.marks, 0)}
                    </div>
                  </div>
                ))}

                {formData.sections.length === 0 && (
                  <div className="text-center py-8">
                    <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sections added</h3>
                    <p className="text-gray-500">Add sections to organize your exam questions.</p>
                  </div>
                )}
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Question Selection</h3>
                
                {formData.sections.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Please add sections first before selecting questions.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Available Questions */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Available Questions</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {availableQuestions.map((question) => (
                          <div
                            key={question.id}
                            className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 cursor-pointer"
                            onClick={() => {
                              if (formData.sections.length > 0) {
                                addQuestionToSection(formData.sections[0].id, question);
                              }
                            }}
                          >
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {question.questionText.substring(0, 100)}...
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded-full ${
                                question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {question.difficulty}
                              </span>
                              <span>{question.subject}</span>
                              <span>{question.marks} marks</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selected Questions by Section */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Selected Questions</h4>
                      {formData.sections.map((section) => (
                        <div key={section.id} className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">{section.name}</h5>
                          <div className="space-y-2">
                            {section.questions.map((question) => (
                              <div
                                key={question.id}
                                className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                              >
                                <div className="text-sm text-gray-900 mb-1">
                                  {question.questionText.substring(0, 80)}...
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">{question.marks} marks</span>
                                  <button
                                    type="button"
                                    onClick={() => removeQuestionFromSection(section.id, question.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {section.questions.length === 0 && (
                              <p className="text-sm text-gray-500">No questions selected</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Exam Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">General Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Negative Marking</div>
                          <div className="text-sm text-gray-500">Enable negative marking for wrong answers</div>
                        </div>
                        <input
                          type="checkbox"
                          name="negativeMarking"
                          checked={formData.negativeMarking}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Partial Credit</div>
                          <div className="text-sm text-gray-500">Allow partial credit for numerical questions</div>
                        </div>
                        <input
                          type="checkbox"
                          name="partialCredit"
                          checked={formData.partialCredit}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Randomize Questions</div>
                          <div className="text-sm text-gray-500">Show questions in random order</div>
                        </div>
                        <input
                          type="checkbox"
                          name="randomizeQuestions"
                          checked={formData.randomizeQuestions}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Randomize Options</div>
                          <div className="text-sm text-gray-500">Shuffle MCQ options</div>
                        </div>
                        <input
                          type="checkbox"
                          name="randomizeOptions"
                          checked={formData.randomizeOptions}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Attempt Settings</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Attempts
                        </label>
                        <input
                          type="number"
                          name="maxAttempts"
                          value={formData.maxAttempts}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passing Score
                        </label>
                        <input
                          type="number"
                          name="passingScore"
                          value={formData.passingScore}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Active Exam</div>
                          <div className="text-sm text-gray-500">Make exam available to students</div>
                        </div>
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Instructions
                  </label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="General instructions for students taking this exam..."
                  />
                </div>
              </div>
            )}

            {/* Proctoring Tab */}
            {activeTab === 'proctoring' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Proctoring Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Enable Proctoring</div>
                    <div className="text-sm text-gray-500">Enable AI-based proctoring for this exam</div>
                  </div>
                  <input
                    type="checkbox"
                    name="proctoringEnabled"
                    checked={formData.proctoringEnabled}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                {formData.proctoringEnabled && (
                  <div className="space-y-4 pl-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Webcam Required</div>
                        <div className="text-sm text-gray-500">Students must enable webcam during exam</div>
                      </div>
                      <input
                        type="checkbox"
                        name="webcamRequired"
                        checked={formData.webcamRequired}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Screen Recording</div>
                        <div className="text-sm text-gray-500">Record student's screen during exam</div>
                      </div>
                      <input
                        type="checkbox"
                        name="screenRecording"
                        checked={formData.screenRecording}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Tab Switching Detection</div>
                        <div className="text-sm text-gray-500">Detect when students switch browser tabs</div>
                      </div>
                      <input
                        type="checkbox"
                        name="tabSwitchingDetection"
                        checked={formData.tabSwitchingDetection}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Proctoring Features</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• AI-powered face detection and monitoring</li>
                    <li>• Multiple face detection (prevents cheating with others)</li>
                    <li>• Screen recording and analysis</li>
                    <li>• Browser tab switching detection</li>
                    <li>• Real-time violation alerts to administrators</li>
                    <li>• Post-exam review and analysis</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  const tabs = ['basic', 'sections', 'questions', 'settings', 'proctoring'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1] as any);
                  }
                }}
                disabled={activeTab === 'basic'}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'sections', 'questions', 'settings', 'proctoring'];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1] as any);
                    }
                  }}
                  disabled={activeTab === 'proctoring'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
                </button>

                {activeTab === 'proctoring' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Exam'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 