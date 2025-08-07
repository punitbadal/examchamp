'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AcademicCapIcon, 
  ClockIcon, 
  StarIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ChartBarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Subject {
  _id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  difficulty: string;
  icon: string;
  color: string;
  stats: {
    totalChapters: number;
    totalTopics: number;
    totalQuestions: number;
    totalExams: number;
    totalPracticeTests: number;
  };
}

interface PracticeTest {
  _id: string;
  title: string;
  description: string;
  subject: string;
  questionCount: number;
  timeLimit: number;
  difficulty: string;
  isPaid: boolean;
  price: number;
  stats: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
  };
}

export default function SubjectPracticeTestsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadPracticeTests();
    }
  }, [selectedSubject, searchTerm, difficultyFilter]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subjects?limit=1000', {
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
    } finally {
      setLoading(false);
    }
  };

  const loadPracticeTests = async () => {
    if (!selectedSubject) return;

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        subject: selectedSubject.name,
        search: searchTerm,
        difficulty: difficultyFilter
      });

      const response = await fetch(`/api/practice-tests?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPracticeTests(data.practiceTests || []);
      } else {
        console.error('Failed to load practice tests');
      }
    } catch (error) {
      console.error('Error loading practice tests:', error);
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to start practice tests');
        return;
      }

      const response = await fetch(`/api/practice-tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = `/practice/${testId}/attempt/${data.attempt._id}`;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to start practice test');
      }
    } catch (error) {
      console.error('Error starting practice test:', error);
      toast.error('Failed to start practice test');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Science': 'bg-blue-100 text-blue-800',
      'Mathematics': 'bg-green-100 text-green-800',
      'Engineering': 'bg-purple-100 text-purple-800',
      'Medical': 'bg-red-100 text-red-800',
      'Commerce': 'bg-yellow-100 text-yellow-800',
      'Arts': 'bg-pink-100 text-pink-800',
      'General': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'Beginner': 'bg-green-100 text-green-800',
      'Intermediate': 'bg-yellow-100 text-yellow-800',
      'Advanced': 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Subject Practice Tests
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose a subject and take practice tests to improve your knowledge and skills.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedSubject ? (
          // Subject Selection
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose a Subject</h2>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects
                .filter(subject => 
                  subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  subject.code.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((subject, index) => (
                <motion.div
                  key={subject._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => setSelectedSubject(subject)}
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: subject.color }}
                      >
                        {subject.icon || '📚'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                        <p className="text-sm text-gray-500">{subject.code}</p>
                      </div>
                    </div>

                    {subject.description && (
                      <p className="text-sm text-gray-600 mb-4">{subject.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(subject.category)}`}>
                        {subject.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(subject.difficulty)}`}>
                        {subject.difficulty}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-gray-900">{subject.stats.totalChapters}</div>
                        <div className="text-gray-600">Chapters</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-gray-900">{subject.stats.totalTopics}</div>
                        <div className="text-gray-600">Topics</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-gray-900">{subject.stats.totalQuestions}</div>
                        <div className="text-gray-600">Questions</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-gray-900">{subject.stats.totalPracticeTests}</div>
                        <div className="text-gray-600">Tests</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <PlayIcon className="h-4 w-4 mr-2" />
                        Start Practice Tests
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          // Practice Tests for Selected Subject
          <div>
            <div className="mb-6">
              <button
                onClick={() => setSelectedSubject(null)}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                ← Back to Subjects
              </button>
              
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: selectedSubject.color }}
                >
                  {selectedSubject.icon || '📚'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedSubject.name} Practice Tests</h2>
                  <p className="text-gray-600">{selectedSubject.description}</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search practice tests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>

                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDifficultyFilter('');
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Practice Tests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {practiceTests.map((test, index) => (
                <motion.div
                  key={test._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{test.title}</h3>
                    
                    <p className="text-sm text-gray-600 mb-4">{test.description}</p>

                    <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Questions:</span>
                        <span className="font-medium">{test.questionCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">{formatDuration(test.timeLimit)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Difficulty:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty)}`}>
                          {test.difficulty}
                        </span>
                      </div>
                    </div>

                    {test.stats.totalAttempts > 0 && (
                      <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Avg Score:</span>
                          <span className="font-medium">{Math.round(test.stats.averageScore)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Pass Rate:</span>
                          <span className="font-medium">{Math.round(test.stats.passRate)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Attempts:</span>
                          <span className="font-medium">{test.stats.totalAttempts.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {test.isPaid ? (
                        <div className="flex items-center">
                          <LockClosedIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            ₹{test.price}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-green-600 font-medium">Free</span>
                      )}

                      <button
                        onClick={() => handleStartTest(test._id)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Start Test
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {practiceTests.length === 0 && (
              <div className="text-center py-12">
                <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No practice tests found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or check back later for new tests.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 