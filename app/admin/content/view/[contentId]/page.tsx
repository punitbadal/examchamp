'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  DocumentIcon,
  VideoCameraIcon,
  PhotoIcon,
  LinkIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  EyeSlashIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface ContentItem {
  _id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'image' | 'link' | 'presentation';
  subject: string;
  topic: string;
  category: string;
  tags: string[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  url?: string;
  duration?: number;
  thumbnailUrl?: string;
  isPremium: boolean;
  isPublic: boolean;
  status: 'draft' | 'published' | 'archived';
  views: number;
  downloads: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const ViewContentPage = () => {
  const router = useRouter();
  const params = useParams();
  const contentId = params.contentId as string;

  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contentId) {
      fetchContent();
    }
  }, [contentId]);

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        router.push('/auth');
        return;
      }

      const response = await fetch(`/api/study-materials/${contentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      setContent(data.studyMaterial);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return DocumentIcon;
      case 'video': return VideoCameraIcon;
      case 'image': return PhotoIcon;
      case 'link': return LinkIcon;
      case 'presentation': return DocumentTextIcon;
      default: return DocumentIcon;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'document': 'Document',
      'video': 'Video',
      'image': 'Image',
      'link': 'Link',
      'presentation': 'Presentation'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'text-yellow-600 bg-yellow-100',
      'published': 'text-green-600 bg-green-100',
      'archived': 'text-gray-600 bg-gray-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${content?.title}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/study-materials/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Content deleted successfully');
        router.push('/admin/content');
      } else {
        toast.error('Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Error deleting content');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Not Found</h2>
          <p className="text-gray-600 mb-4">The content you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/content')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Content
          </button>
        </div>
      </div>
    );
  }

  const IconComponent = getTypeIcon(content.type);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/admin/content')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Content Details</h1>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/admin/content/edit/${contentId}`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <IconComponent className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{content.title}</h2>
                <p className="text-gray-600 mt-1">{content.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(content.status)}`}>
                    {content.status}
                  </span>
                  {content.isPremium && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Premium
                    </span>
                  )}
                  {!content.isPublic && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Private
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content Type and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Content Type</h3>
                <p className="text-gray-600">{getTypeLabel(content.type)}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Category</h3>
                <p className="text-gray-600">{content.category}</p>
              </div>
            </div>

            {/* Subject and Topic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Subject</h3>
                <p className="text-gray-600">{content.subject}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Topic</h3>
                <p className="text-gray-600">{content.topic || 'Not specified'}</p>
              </div>
            </div>

            {/* File Information */}
            {content.fileUrl && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">File Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">File Name</p>
                      <p className="text-gray-900">{content.fileName}</p>
                    </div>
                    {content.fileSize && (
                      <div>
                        <p className="text-sm text-gray-500">File Size</p>
                        <p className="text-gray-900">{formatFileSize(content.fileSize)}</p>
                      </div>
                    )}
                    {content.duration && (
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="text-gray-900">{content.duration} minutes</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <a
                      href={content.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <DocumentIcon className="w-4 h-4" />
                      <span>View File</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* URL */}
            {content.url && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">External URL</h3>
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                >
                  {content.url}
                </a>
              </div>
            )}

            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center space-x-2">
                    <EyeIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-500">Views</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{content.views}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center space-x-2">
                    <DocumentIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-500">Downloads</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{content.downloads}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AcademicCapIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-500">Rating</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{content.rating.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">({content.ratingCount} reviews)</p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Content Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-gray-900">{formatDate(content.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="text-gray-900">{formatDate(content.updatedAt)}</p>
                </div>
                {content.createdBy && (
                  <div>
                    <p className="text-gray-500">Created By</p>
                    <p className="text-gray-900">
                      {content.createdBy.firstName} {content.createdBy.lastName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Content ID</p>
                  <p className="text-gray-900 font-mono text-xs">{content._id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewContentPage; 