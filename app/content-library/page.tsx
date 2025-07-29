'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  PlayIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  StarIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface StudyMaterial {
  id: string;
  title: string;
  type: 'notes' | 'video' | 'paper' | 'formula' | 'summary';
  subject: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // for videos
  pages?: number; // for documents
  author: string;
  rating: number;
  downloads: number;
  views: number;
  createdAt: string;
  tags: string[];
  description: string;
  thumbnail?: string;
  fileUrl?: string;
  videoUrl?: string;
  isPremium: boolean;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  topics: string[];
}

export default function ContentLibrary() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  const subjects: Subject[] = [
    { id: 'physics', name: 'Physics', icon: '⚡', color: 'blue', topics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Modern Physics'] },
    { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'green', topics: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Analytical Chemistry'] },
    { id: 'mathematics', name: 'Mathematics', icon: '📐', color: 'purple', topics: ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics'] },
    { id: 'biology', name: 'Biology', icon: '🧬', color: 'emerald', topics: ['Botany', 'Zoology', 'Human Physiology', 'Genetics', 'Ecology'] }
  ];

  const materialTypes = [
    { value: 'notes', label: 'Notes', icon: DocumentTextIcon },
    { value: 'video', label: 'Videos', icon: PlayIcon },
    { value: 'paper', label: 'Previous Papers', icon: BookOpenIcon },
    { value: 'formula', label: 'Formula Sheets', icon: AcademicCapIcon },
    { value: 'summary', label: 'Summaries', icon: DocumentTextIcon }
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner', color: 'green' },
    { value: 'intermediate', label: 'Intermediate', color: 'yellow' },
    { value: 'advanced', label: 'Advanced', color: 'red' }
  ];

  useEffect(() => {
    loadStudyMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchTerm, selectedSubject, selectedType, selectedDifficulty, sortBy, sortOrder]);

  const loadStudyMaterials = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, fetch from API
      const mockMaterials: StudyMaterial[] = [
        {
          id: '1',
          title: 'Complete Mechanics Notes - JEE Main',
          type: 'notes',
          subject: 'physics',
          topic: 'Mechanics',
          difficulty: 'intermediate',
          pages: 45,
          author: 'Dr. Rajesh Kumar',
          rating: 4.8,
          downloads: 1250,
          views: 3400,
          createdAt: '2024-01-15',
          tags: ['mechanics', 'jee', 'physics', 'kinematics'],
          description: 'Comprehensive notes covering all mechanics topics for JEE Main preparation.',
          isPremium: false
        },
        {
          id: '2',
          title: 'Organic Chemistry Video Series',
          type: 'video',
          subject: 'chemistry',
          topic: 'Organic Chemistry',
          difficulty: 'advanced',
          duration: 180,
          author: 'Prof. Priya Sharma',
          rating: 4.9,
          downloads: 0,
          views: 8900,
          createdAt: '2024-01-10',
          tags: ['organic', 'chemistry', 'jee', 'reactions'],
          description: 'Complete video series on organic chemistry reactions and mechanisms.',
          videoUrl: 'https://example.com/video1',
          isPremium: true
        },
        {
          id: '3',
          title: 'JEE Main 2023 Physics Paper',
          type: 'paper',
          subject: 'physics',
          topic: 'Previous Papers',
          difficulty: 'intermediate',
          author: 'NTA',
          rating: 4.7,
          downloads: 2100,
          views: 5600,
          createdAt: '2024-01-05',
          tags: ['jee', '2023', 'physics', 'paper'],
          description: 'Complete JEE Main 2023 Physics question paper with solutions.',
          fileUrl: 'https://example.com/paper1.pdf',
          isPremium: false
        },
        {
          id: '4',
          title: 'Calculus Formula Sheet',
          type: 'formula',
          subject: 'mathematics',
          topic: 'Calculus',
          difficulty: 'beginner',
          author: 'Math Academy',
          rating: 4.6,
          downloads: 3200,
          views: 7800,
          createdAt: '2024-01-20',
          tags: ['calculus', 'formulas', 'math', 'jee'],
          description: 'Quick reference formula sheet for calculus topics.',
          isPremium: false
        },
        {
          id: '5',
          title: 'Biology Chapter Summary',
          type: 'summary',
          subject: 'biology',
          topic: 'Human Physiology',
          difficulty: 'intermediate',
          author: 'Dr. Amit Patel',
          rating: 4.5,
          downloads: 890,
          views: 2100,
          createdAt: '2024-01-12',
          tags: ['biology', 'physiology', 'summary', 'neet'],
          description: 'Concise summary of human physiology chapters for NEET preparation.',
          isPremium: false
        }
      ];

      setMaterials(mockMaterials);
    } catch (error) {
      console.error('Error loading study materials:', error);
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = [...materials];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Subject filter
    if (selectedSubject) {
      filtered = filtered.filter(material => material.subject === selectedSubject);
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(material => material.type === selectedType);
    }

    // Difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(material => material.difficulty === selectedDifficulty);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'downloads':
          aValue = a.downloads;
          bValue = b.downloads;
          break;
        case 'views':
          aValue = a.views;
          bValue = b.views;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredMaterials(filtered);
  };

  const handleDownload = (material: StudyMaterial) => {
    if (material.isPremium) {
      toast.error('This is a premium material. Please upgrade to access.');
      return;
    }
    
    toast.success('Download started...');
    // In real app, trigger actual download
  };

  const handleView = (material: StudyMaterial) => {
    if (material.type === 'video') {
      window.open(material.videoUrl, '_blank');
    } else if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
    } else {
      toast('Preview not available for this material');
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = materialTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : DocumentTextIcon;
  };

  const getDifficultyColor = (difficulty: string) => {
    const diffConfig = difficulties.find(d => d.value === difficulty);
    return diffConfig ? diffConfig.color : 'gray';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Study Materials Library
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access comprehensive study materials, video lectures, previous year papers, 
              and formula sheets to enhance your exam preparation.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search study materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Subject Filter */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {materialTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt-desc">Latest</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="downloads-desc">Most Downloaded</option>
                <option value="views-desc">Most Viewed</option>
                <option value="title-asc">Name A-Z</option>
              </select>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                Filters
                {showFilters ? (
                  <ChevronUpIcon className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                  <input
                    type="text"
                    placeholder="Search by author..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>All Time</option>
                    <option>Last Week</option>
                    <option>Last Month</option>
                    <option>Last 3 Months</option>
                    <option>Last Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>All Ratings</option>
                    <option>4+ Stars</option>
                    <option>3+ Stars</option>
                    <option>2+ Stars</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Materials Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material, index) => {
                const TypeIcon = getTypeIcon(material.type);
                const subject = subjects.find(s => s.id === material.subject);
                
                return (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Material Thumbnail */}
                    <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg">
                      <div className="flex items-center justify-center h-full">
                        <TypeIcon className="h-16 w-16 text-white opacity-80" />
                      </div>
                      
                      {/* Type Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-90 text-gray-800">
                          {materialTypes.find(t => t.value === material.type)?.label}
                        </span>
                      </div>

                      {/* Subject Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-90 text-gray-800">
                          {subject?.name}
                        </span>
                      </div>

                      {/* Premium Badge */}
                      {material.isPremium && (
                        <div className="absolute bottom-3 left-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-400 text-yellow-900">
                            Premium
                          </span>
                        </div>
                      )}

                      {/* Difficulty Badge */}
                      <div className="absolute bottom-3 right-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getDifficultyColor(material.difficulty)}-100 text-${getDifficultyColor(material.difficulty)}-800`}>
                          {material.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Material Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {material.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {material.description}
                      </p>

                      {/* Material Stats */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Author:</span>
                          <span className="font-medium">{material.author}</span>
                        </div>
                        {material.duration && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Duration:</span>
                            <span className="font-medium">{formatDuration(material.duration)}</span>
                          </div>
                        )}
                        {material.pages && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Pages:</span>
                            <span className="font-medium">{material.pages}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Topic:</span>
                          <span className="font-medium">{material.topic}</span>
                        </div>
                      </div>

                      {/* Rating and Stats */}
                      <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Rating:</span>
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="font-medium">{material.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Downloads:</span>
                          <span className="font-medium">{material.downloads.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Views:</span>
                          <span className="font-medium">{material.views.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {material.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {material.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            +{material.tags.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {formatDate(material.createdAt)}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleView(material)}
                            className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            <EyeIcon className="h-3 w-3 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownload(material)}
                            className="flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Library Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{materials.length}</div>
                  <div className="text-sm text-gray-600">Total Materials</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {materials.filter(m => m.type === 'video').length}
                  </div>
                  <div className="text-sm text-gray-600">Video Lectures</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {materials.filter(m => m.type === 'paper').length}
                  </div>
                  <div className="text-sm text-gray-600">Previous Papers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {materials.reduce((sum, m) => sum + m.downloads, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Downloads</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 