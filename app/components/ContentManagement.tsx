'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpenIcon,
  PlayIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  PlusIcon,
  UploadIcon,
  FolderIcon,
  VideoCameraIcon,
  DocumentIcon,
  ImageIcon,
  LinkIcon,
  SearchIcon,
  FilterIcon,
  SortAscendingIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  DownloadIcon,
  ShareIcon,
  StarIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FolderPlusIcon,
  VideoIcon,
  FileTextIcon,
  PresentationChartBarIcon
} from '@heroicons/react/24/outline';

interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'document' | 'image' | 'link' | 'presentation';
  subject: string;
  topic: string;
  description: string;
  author: string;
  uploadDate: Date;
  lastModified: Date;
  size: number; // in bytes
  duration?: number; // for videos
  pages?: number; // for documents
  tags: string[];
  thumbnail?: string;
  url?: string;
  filePath?: string;
  isPublic: boolean;
  isPremium: boolean;
  views: number;
  downloads: number;
  rating: number;
  status: 'draft' | 'published' | 'archived';
}

interface ContentFolder {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  subject: string;
  topic: string;
  itemCount: number;
  createdDate: Date;
  lastModified: Date;
  isPublic: boolean;
}

interface ContentManagementProps {
  subject?: string;
  topic?: string;
  showUpload?: boolean;
}

export default function ContentManagement({
  subject,
  topic,
  showUpload = true
}: ContentManagementProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'documents' | 'images' | 'links'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('uploadDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    loadContent();
  }, [subject, topic]);

  const loadContent = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, fetch from API
      const mockContent: ContentItem[] = [
        {
          id: '1',
          title: 'JEE Physics Complete Course',
          type: 'video',
          subject: 'physics',
          topic: 'mechanics',
          description: 'Complete video course covering all JEE Physics topics with detailed explanations',
          author: 'Dr. Rajesh Kumar',
          uploadDate: new Date('2024-01-15'),
          lastModified: new Date('2024-01-20'),
          size: 1024 * 1024 * 500, // 500MB
          duration: 7200, // 2 hours
          tags: ['jee', 'physics', 'mechanics', 'video'],
          url: 'https://youtube.com/watch?v=example1',
          isPublic: true,
          isPremium: false,
          views: 1250,
          downloads: 0,
          rating: 4.8,
          status: 'published'
        },
        {
          id: '2',
          title: 'Chemistry Formula Sheet',
          type: 'document',
          subject: 'chemistry',
          topic: 'organic',
          description: 'Comprehensive formula sheet for organic chemistry reactions',
          author: 'Prof. Priya Sharma',
          uploadDate: new Date('2024-01-10'),
          lastModified: new Date('2024-01-12'),
          size: 1024 * 1024 * 2, // 2MB
          pages: 15,
          tags: ['chemistry', 'organic', 'formulas', 'jee'],
          filePath: '/uploads/chemistry-formulas.pdf',
          isPublic: true,
          isPremium: false,
          views: 890,
          downloads: 450,
          rating: 4.6,
          status: 'published'
        },
        {
          id: '3',
          title: 'Mathematics Integration Techniques',
          type: 'presentation',
          subject: 'mathematics',
          topic: 'calculus',
          description: 'PowerPoint presentation on integration techniques',
          author: 'Dr. Amit Patel',
          uploadDate: new Date('2024-01-08'),
          lastModified: new Date('2024-01-08'),
          size: 1024 * 1024 * 5, // 5MB
          pages: 25,
          tags: ['mathematics', 'calculus', 'integration', 'presentation'],
          filePath: '/uploads/integration-techniques.pptx',
          isPublic: false,
          isPremium: true,
          views: 320,
          downloads: 120,
          rating: 4.7,
          status: 'published'
        },
        {
          id: '4',
          title: 'Biology Cell Division Animation',
          type: 'video',
          subject: 'biology',
          topic: 'cell-biology',
          description: 'Animated video explaining cell division process',
          author: 'Dr. Meera Singh',
          uploadDate: new Date('2024-01-05'),
          lastModified: new Date('2024-01-05'),
          size: 1024 * 1024 * 150, // 150MB
          duration: 1800, // 30 minutes
          tags: ['biology', 'cell-division', 'animation', 'neet'],
          url: 'https://vimeo.com/example2',
          isPublic: true,
          isPremium: false,
          views: 2100,
          downloads: 0,
          rating: 4.9,
          status: 'published'
        }
      ];

      const mockFolders: ContentFolder[] = [
        {
          id: '1',
          name: 'JEE Physics',
          description: 'All physics content for JEE preparation',
          subject: 'physics',
          topic: 'jee',
          itemCount: 12,
          createdDate: new Date('2024-01-01'),
          lastModified: new Date('2024-01-20'),
          isPublic: true
        },
        {
          id: '2',
          name: 'Chemistry Notes',
          description: 'Comprehensive chemistry study materials',
          subject: 'chemistry',
          topic: 'notes',
          itemCount: 8,
          createdDate: new Date('2024-01-02'),
          lastModified: new Date('2024-01-15'),
          isPublic: true
        },
        {
          id: '3',
          name: 'Mathematics Videos',
          description: 'Video lectures for mathematics topics',
          subject: 'mathematics',
          topic: 'videos',
          itemCount: 15,
          createdDate: new Date('2024-01-03'),
          lastModified: new Date('2024-01-18'),
          isPublic: false
        }
      ];

      setContent(mockContent);
      setFolders(mockFolders);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return VideoIcon;
      case 'document':
        return DocumentTextIcon;
      case 'image':
        return ImageIcon;
      case 'link':
        return LinkIcon;
      case 'presentation':
        return PresentationChartBarIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-100';
      case 'draft':
        return 'text-yellow-600 bg-yellow-100';
      case 'archived':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = activeTab === 'all' || item.type === activeTab;
    const matchesFolder = !selectedFolder || item.subject === selectedFolder;
    
    return matchesSearch && matchesType && matchesFolder;
  });

  const sortedContent = [...filteredContent].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'uploadDate':
        aValue = a.uploadDate.getTime();
        bValue = b.uploadDate.getTime();
        break;
      case 'views':
        aValue = a.views;
        bValue = b.views;
        break;
      case 'rating':
        aValue = a.rating;
        bValue = b.rating;
        break;
      default:
        aValue = a.uploadDate.getTime();
        bValue = b.uploadDate.getTime();
    }

    return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  });

  const handleUpload = () => {
    setUploadModal(true);
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBulkAction = (action: string) => {
    // Handle bulk actions like delete, move, etc.
    console.log(`Bulk action: ${action}`, selectedItems);
    setSelectedItems([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpenIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Content Management</h2>
              <p className="text-sm text-gray-600">
                Organize and manage study materials, videos, and documents
              </p>
            </div>
          </div>
          
          {showUpload && (
            <button
              onClick={handleUpload}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UploadIcon className="h-4 w-4" />
              <span>Upload Content</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Type Filter */}
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="videos">Videos</option>
              <option value="documents">Documents</option>
              <option value="images">Images</option>
              <option value="links">Links</option>
            </select>

            {/* Folder Filter */}
            <select
              value={selectedFolder || ''}
              onChange={(e) => setSelectedFolder(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Folders</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
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
              <option value="uploadDate-desc">Latest</option>
              <option value="uploadDate-asc">Oldest</option>
              <option value="title-asc">Name A-Z</option>
              <option value="title-desc">Name Z-A</option>
              <option value="views-desc">Most Viewed</option>
              <option value="rating-desc">Highest Rated</option>
            </select>

            {/* Advanced Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FilterIcon className="h-4 w-4 mr-1" />
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                <input
                  type="text"
                  placeholder="Filter by author..."
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Status</option>
                  <option>Published</option>
                  <option>Draft</option>
                  <option>Archived</option>
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

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedItems.length} item(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('move')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Move
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
            ))}
          </div>
        ) : sortedContent.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or upload new content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedContent.map((item, index) => {
              const TypeIcon = getTypeIcon(item.type);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 ${
                    selectedItems.includes(item.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <div className="p-4 border-b border-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleItemSelect(item.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  {/* Content Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg">
                    <div className="flex items-center justify-center h-full">
                      <TypeIcon className="h-16 w-16 text-white opacity-80" />
                    </div>
                    
                    {/* Type Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-90 text-gray-800">
                        {item.type.toUpperCase()}
                      </span>
                    </div>

                    {/* Premium Badge */}
                    {item.isPremium && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-400 text-yellow-900">
                          Premium
                        </span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Duration/Pages Badge */}
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-90 text-gray-800">
                        {item.type === 'video' && item.duration ? formatDuration(item.duration) :
                         item.type === 'document' && item.pages ? `${item.pages} pages` :
                         formatFileSize(item.size)}
                      </span>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center space-x-2">
                        <EyeIcon className="h-3 w-3" />
                        <span>{item.views}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DownloadIcon className="h-3 w-3" />
                        <span>{item.downloads}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StarIcon className="h-3 w-3" />
                        <span>{item.rating}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          +{item.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {item.uploadDate.toLocaleDateString()}
                      </div>

                      <div className="flex space-x-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal Placeholder */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Content</h3>
            <p className="text-gray-600 mb-4">Upload modal implementation would go here.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setUploadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 