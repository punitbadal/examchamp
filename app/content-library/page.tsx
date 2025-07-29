'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  PhotoIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Bars3Icon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  StarIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FolderPlusIcon,
  PresentationChartBarIcon,
  AcademicCapIcon,
  PlayIcon,
  ClockIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface StudyMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'article' | 'presentation' | 'formula_sheet' | 'notes' | 'previous_papers';
  category: string;
  subject: string;
  description: string;
  fileSize: string;
  uploadDate: Date;
  views: number;
  downloads: number;
  isPremium: boolean;
  status: 'draft' | 'published' | 'archived';
  rating: number;
  ratingCount: number;
  duration?: number;
}

interface PracticeTest {
  id: string;
  title: string;
  type: 'topic_quiz' | 'chapter_test' | 'subject_test' | 'mock_exam' | 'custom';
  level: string;
  subject: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  passingScore: number;
  totalMarks: number;
  attempts: number;
  averageScore: number;
  isPremium: boolean;
  status: 'draft' | 'published' | 'archived';
}

interface Subject {
  id: string;
  name: string;
  materialCount: number;
  testCount: number;
}

export default function ContentLibrary() {
  const [activeTab, setActiveTab] = useState<'materials' | 'tests'>('materials');
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, fetch from API
      const mockMaterials: StudyMaterial[] = [
        {
          id: '1',
          title: 'JEE Main Physics Formula Sheet',
          type: 'formula_sheet',
          category: 'Formula Sheets',
          subject: 'Physics',
          description: 'Comprehensive formula sheet for JEE Main Physics preparation',
          fileSize: '2.5 MB',
          uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          views: 1247,
          downloads: 892,
          isPremium: false,
          status: 'published',
          rating: 4.5,
          ratingCount: 156
        },
        {
          id: '2',
          title: 'NEET Biology Video Series',
          type: 'video',
          category: 'Video Lectures',
          subject: 'Biology',
          description: 'Complete video series covering NEET Biology syllabus',
          fileSize: '156 MB',
          uploadDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          views: 2341,
          downloads: 0,
          isPremium: true,
          status: 'published',
          rating: 4.8,
          ratingCount: 89,
          duration: 180
        },
        {
          id: '3',
          title: 'Chemistry Study Notes - Organic Chemistry',
          type: 'notes',
          category: 'Study Notes',
          subject: 'Chemistry',
          description: 'Detailed notes on Organic Chemistry for JEE preparation',
          fileSize: '1.8 MB',
          uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          views: 567,
          downloads: 234,
          isPremium: false,
          status: 'published',
          rating: 4.2,
          ratingCount: 45
        },
        {
          id: '4',
          title: 'Mathematics Previous Year Papers',
          type: 'previous_papers',
          category: 'Previous Papers',
          subject: 'Mathematics',
          description: 'Collection of previous year JEE Mathematics papers with solutions',
          fileSize: '5.2 MB',
          uploadDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
          views: 1890,
          downloads: 1200,
          isPremium: true,
          status: 'published',
          rating: 4.6,
          ratingCount: 234
        }
      ];

      const mockPracticeTests: PracticeTest[] = [
        {
          id: '1',
          title: 'JEE Physics - Mechanics Quiz',
          type: 'topic_quiz',
          level: 'Intermediate',
          subject: 'Physics',
          description: 'Practice test covering mechanics topics for JEE preparation',
          questionCount: 25,
          timeLimit: 60,
          passingScore: 60,
          totalMarks: 100,
          attempts: 156,
          averageScore: 72.5,
          isPremium: false,
          status: 'published'
        },
        {
          id: '2',
          title: 'NEET Biology - Human Physiology',
          type: 'chapter_test',
          level: 'Advanced',
          subject: 'Biology',
          description: 'Comprehensive test on human physiology for NEET',
          questionCount: 40,
          timeLimit: 90,
          passingScore: 70,
          totalMarks: 160,
          attempts: 89,
          averageScore: 68.3,
          isPremium: true,
          status: 'published'
        },
        {
          id: '3',
          title: 'GATE CS - Data Structures',
          type: 'subject_test',
          level: 'Expert',
          subject: 'Computer Science',
          description: 'Advanced practice test on data structures for GATE',
          questionCount: 30,
          timeLimit: 120,
          passingScore: 65,
          totalMarks: 120,
          attempts: 234,
          averageScore: 75.8,
          isPremium: true,
          status: 'published'
        }
      ];

      const mockSubjects: Subject[] = [
        { id: '1', name: 'Physics', materialCount: 15, testCount: 8 },
        { id: '2', name: 'Chemistry', materialCount: 12, testCount: 6 },
        { id: '3', name: 'Mathematics', materialCount: 18, testCount: 10 },
        { id: '4', name: 'Biology', materialCount: 9, testCount: 4 },
        { id: '5', name: 'Computer Science', materialCount: 6, testCount: 3 }
      ];

      setMaterials(mockMaterials);
      setPracticeTests(mockPracticeTests);
      setSubjects(mockSubjects);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return VideoCameraIcon;
      case 'pdf':
      case 'article':
      case 'notes':
      case 'formula_sheet':
      case 'previous_papers':
        return DocumentTextIcon;
      case 'presentation':
        return PresentationChartBarIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-600';
      case 'pdf':
      case 'article':
      case 'notes':
        return 'bg-blue-100 text-blue-600';
      case 'formula_sheet':
        return 'bg-green-100 text-green-600';
      case 'previous_papers':
        return 'bg-purple-100 text-purple-600';
      case 'presentation':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleDownload = async (material: StudyMaterial) => {
    try {
      // In a real app, this would make an API call to download the file
      console.log('Downloading:', material.title);
      toast.success('Download started!');
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Download failed');
    }
  };

  const handleView = async (material: StudyMaterial) => {
    try {
      // In a real app, this would open the material in a viewer
      console.log('Viewing:', material.title);
      toast.success('Opening material...');
    } catch (error) {
      console.error('Error viewing:', error);
      toast.error('Failed to open material');
    }
  };

  const handleStartTest = async (test: PracticeTest) => {
    try {
      // In a real app, this would navigate to the test interface
      console.log('Starting test:', test.title);
      toast.success('Starting test...');
      // Navigate to test page
      window.location.href = `/practice/${test.id}`;
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error('Failed to start test');
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSubject = selectedSubject === 'all' || material.subject === selectedSubject;
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesCategory && matchesSearch;
  });

  const filteredTests = practiceTests.filter(test => {
    const matchesSubject = selectedSubject === 'all' || test.subject === selectedSubject;
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const renderMaterials = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Study Materials</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white p-4 rounded-lg border border-gray-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.name}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="Formula Sheets">Formula Sheets</option>
                <option value="Video Lectures">Video Lectures</option>
                <option value="Study Notes">Study Notes</option>
                <option value="Previous Papers">Previous Papers</option>
                <option value="Practice Questions">Practice Questions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => {
          const Icon = getTypeIcon(material.type);
          return (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(material.type)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{material.title}</h3>
                      <p className="text-sm text-gray-600">{material.subject}</p>
                    </div>
                  </div>
                  {material.isPremium && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Premium
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4">{material.description}</p>

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center justify-between">
                    <span>Category</span>
                    <span className="font-medium">{material.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>File Size</span>
                    <span className="font-medium">{material.fileSize}</span>
                  </div>
                  {material.duration && (
                    <div className="flex items-center justify-between">
                      <span>Duration</span>
                      <span className="font-medium">{material.duration} min</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Rating</span>
                    <div className="flex items-center space-x-1">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="font-medium">{material.rating}</span>
                      <span className="text-gray-400">({material.ratingCount})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleView(material)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(material)}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                  >
                    Download
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderPracticeTests = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Practice Tests</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{test.title}</h3>
                    <p className="text-sm text-gray-600">{test.subject}</p>
                  </div>
                </div>
                {test.isPremium && (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Premium
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">{test.description}</p>

              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div className="flex items-center justify-between">
                  <span>Questions</span>
                  <span className="font-medium">{test.questionCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Time Limit</span>
                  <span className="font-medium">{test.timeLimit} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Marks</span>
                  <span className="font-medium">{test.totalMarks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Attempts</span>
                  <span className="font-medium">{test.attempts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Score</span>
                  <span className="font-medium">{test.averageScore}%</span>
                </div>
              </div>

              <button
                onClick={() => handleStartTest(test)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Start Test
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpenIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Content Library</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'materials', name: 'Study Materials', icon: BookOpenIcon },
              { id: 'tests', name: 'Practice Tests', icon: DocumentTextIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'materials' && renderMaterials()}
        {activeTab === 'tests' && renderPracticeTests()}
      </div>
    </div>
  );
} 