'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  PlayIcon,
  BookOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  FolderIcon,
  VideoCameraIcon,
  DocumentIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import CreatePracticeTestForm from '../../components/CreatePracticeTestForm';
import CreateStudyMaterialForm from '../../components/CreateStudyMaterialForm';

interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'document' | 'practice_test' | 'study_material';
  category: string;
  subject: string;
  description: string;
  fileSize: string;
  uploadDate: Date;
  views: number;
  downloads: number;
  isPremium: boolean;
  status: 'active' | 'draft' | 'archived';
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState('library');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateTestForm, setShowCreateTestForm] = useState(false);
  const [showCreateMaterialForm, setShowCreateMaterialForm] = useState(false);

  useEffect(() => {
    fetchContentData();
  }, []);

  const fetchContentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/study-materials', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContentItems(data.materials || []);
      } else {
        console.error('Failed to fetch content data');
        // Fallback to mock data if API fails
        const mockContent: ContentItem[] = [
          {
            id: '1',
            title: 'JEE Main Physics Formula Sheet',
            type: 'document',
            category: 'Formula Sheets',
            subject: 'Physics',
            description: 'Comprehensive formula sheet for JEE Main Physics preparation',
            fileSize: '2.5 MB',
            uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            views: 1247,
            downloads: 892,
            isPremium: false,
            status: 'active'
          }
        ];
        setContentItems(mockContent);
      }
    } catch (error) {
      console.error('Error fetching content data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return VideoCameraIcon;
      case 'document': return DocumentIcon;
      case 'practice_test': return DocumentTextIcon;
      case 'study_material': return BookOpenIcon;
      default: return DocumentIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'archived': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderContentLibrary = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Content Library</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <PlusIcon className="w-4 h-4" />
          <span>Upload Content</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="Formula Sheets">Formula Sheets</option>
            <option value="Video Lectures">Video Lectures</option>
            <option value="Practice Tests">Practice Tests</option>
            <option value="Study Notes">Study Notes</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentItems.map((item) => {
          const IconComponent = getTypeIcon(item.type);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.subject}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.isPremium && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Premium
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{item.description}</p>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Category</span>
                  <span className="font-medium">{item.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>File Size</span>
                  <span className="font-medium">{item.fileSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Upload Date</span>
                  <span className="font-medium">{formatDate(item.uploadDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Views</span>
                  <span className="font-medium">{item.views}</span>
                </div>
                {item.downloads > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Downloads</span>
                    <span className="font-medium">{item.downloads}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-900">
                  <EyeIcon className="w-4 h-4" />
                  <span className="text-sm">View</span>
                </button>
                <button className="flex items-center space-x-1 text-green-600 hover:text-green-900">
                  <PencilIcon className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </button>
                <button className="flex items-center space-x-1 text-red-600 hover:text-red-900">
                  <TrashIcon className="w-4 h-4" />
                  <span className="text-sm">Delete</span>
                </button>
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
        <button 
          onClick={() => setShowCreateTestForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create Test</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentItems.filter(item => item.type === 'practice_test').map((test) => (
          <div key={test.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DocumentTextIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{test.title}</h3>
                  <p className="text-sm text-gray-600">{test.subject}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                {test.status}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-4">{test.description}</p>

            <div className="space-y-2 text-sm text-gray-500 mb-4">
              <div className="flex items-center justify-between">
                <span>Attempts</span>
                <span className="font-medium">{test.views}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Average Score</span>
                <span className="font-medium">78.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duration</span>
                <span className="font-medium">180 min</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm">
                View Results
              </button>
              <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm">
                Edit Test
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStudyMaterials = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Study Materials</h2>
        <button 
          onClick={() => setShowCreateMaterialForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Material</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentItems.filter(item => item.type === 'study_material' || item.type === 'document').map((material) => (
          <div key={material.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpenIcon className="w-6 h-6 text-purple-600" />
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
              <div className="flex items-center justify-between">
                <span>Downloads</span>
                <span className="font-medium">{material.downloads}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm">
                Preview
              </button>
              <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm">
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleCreatePracticeTest = async (data: any) => {
    try {
      // In a real app, this would make an API call to create the practice test
      console.log('Creating practice test:', data);
      // Mock success - in real app, you'd call the API
      alert('Practice test created successfully!');
      // Refresh the content
      fetchContentData();
    } catch (error) {
      console.error('Error creating practice test:', error);
      alert('Error creating practice test');
    }
  };

  const handleCreateStudyMaterial = async (data: any) => {
    try {
      // In a real app, this would make an API call to create the study material
      console.log('Creating study material:', data);
      // Mock success - in real app, you'd call the API
      alert('Study material created successfully!');
      // Refresh the content
      fetchContentData();
    } catch (error) {
      console.error('Error creating study material:', error);
      alert('Error creating study material');
    }
  };

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
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Content Management</span>
            </div>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'library', name: 'Content Library', icon: FolderIcon },
              { id: 'practice', name: 'Practice Tests', icon: DocumentTextIcon },
              { id: 'materials', name: 'Study Materials', icon: BookOpenIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'library' && renderContentLibrary()}
        {activeTab === 'practice' && renderPracticeTests()}
        {activeTab === 'materials' && renderStudyMaterials()}
      </div>

      {/* Forms */}
      <CreatePracticeTestForm
        isOpen={showCreateTestForm}
        onClose={() => setShowCreateTestForm(false)}
        onSubmit={handleCreatePracticeTest}
      />
      
      <CreateStudyMaterialForm
        isOpen={showCreateMaterialForm}
        onClose={() => setShowCreateMaterialForm(false)}
        onSubmit={handleCreateStudyMaterial}
      />
    </div>
  );
} 