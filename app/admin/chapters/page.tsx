'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import RichTextEditor from '../../components/RichTextEditor';
import RichTextRenderer from '../../components/RichTextRenderer';

interface Chapter {
  _id: string;
  name: string;
  code: string;
  description: string;
  subjectId: {
    _id: string;
    name: string;
    code: string;
    category: string;
  };
  subjectName: string;
  chapterNumber: number;
  difficulty: string;
  weightage: number;
  estimatedHours: number;
  isActive: boolean;
  order: number;
  syllabus: string;
  learningObjectives: string[];
  prerequisites: string[];
  stats: {
    totalTopics: number;
    totalQuestions: number;
    totalExams: number;
    totalPracticeTests: number;
    averageScore: number;
    totalAttempts: number;
  };
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  category: string;
}

interface CreateChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
  chapter?: Chapter | null;
  subjects: Subject[];
}

const CreateChapterModal: React.FC<CreateChapterModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading, 
  chapter,
  subjects
}) => {
  const [formData, setFormData] = useState({
    name: chapter?.name || '',
    code: chapter?.code || '',
    description: chapter?.description || '',
    subjectId: chapter?.subjectId?._id || '',
    chapterNumber: chapter?.chapterNumber || 1,
    difficulty: chapter?.difficulty || 'Medium',
    weightage: chapter?.weightage || 0,
    estimatedHours: chapter?.estimatedHours || 0,
    order: chapter?.order || 0,
    syllabus: chapter?.syllabus || '',
    learningObjectives: chapter?.learningObjectives || [],
    prerequisites: chapter?.prerequisites || []
  });

  // Auto-populate chapter code when subject changes
  useEffect(() => {
    if (formData.subjectId && !chapter) { // Only auto-populate for new chapters
      const selectedSubject = subjects.find(subject => subject._id === formData.subjectId);
      if (selectedSubject) {
        setFormData(prev => ({
          ...prev,
          code: `${selectedSubject.code}-`
        }));
      }
    }
  }, [formData.subjectId, subjects, chapter]);

  const [objectiveInput, setObjectiveInput] = useState('');
  const [prerequisiteInput, setPrerequisiteInput] = useState('');

  useEffect(() => {
    if (chapter) {
      setFormData({
        name: chapter.name,
        code: chapter.code,
        description: chapter.description,
        subjectId: chapter.subjectId._id,
        chapterNumber: chapter.chapterNumber,
        difficulty: chapter.difficulty,
        weightage: chapter.weightage,
        estimatedHours: chapter.estimatedHours,
        order: chapter.order,
        syllabus: chapter.syllabus,
        learningObjectives: chapter.learningObjectives,
        prerequisites: chapter.prerequisites
      });
    }
  }, [chapter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addObjective = () => {
    if (objectiveInput.trim() && !formData.learningObjectives.includes(objectiveInput.trim())) {
      setFormData(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, objectiveInput.trim()]
      }));
      setObjectiveInput('');
    }
  };

  const removeObjective = (objectiveToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter(obj => obj !== objectiveToRemove)
    }));
  };

  const addPrerequisite = () => {
    if (prerequisiteInput.trim() && !formData.prerequisites.includes(prerequisiteInput.trim())) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, prerequisiteInput.trim()]
      }));
      setPrerequisiteInput('');
    }
  };

  const removePrerequisite = (prerequisiteToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter(pre => pre !== prerequisiteToRemove)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {chapter ? 'Edit Chapter' : 'Create New Chapter'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a subject</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter Number *
              </label>
              <input
                type="number"
                value={formData.chapterNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, chapterNumber: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Enter chapter description with formatting, bullet points, and mathematical equations..."
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weightage (%)
              </label>
              <input
                type="number"
                value={formData.weightage}
                onChange={(e) => setFormData(prev => ({ ...prev, weightage: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Syllabus
            </label>
            <RichTextEditor
              value={formData.syllabus}
              onChange={(value) => setFormData(prev => ({ ...prev, syllabus: value }))}
              placeholder="Enter chapter syllabus with formatting, bullet points, and mathematical equations..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learning Objectives
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add learning objective and press Enter"
              />
              <button
                type="button"
                onClick={addObjective}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {formData.learningObjectives.map((objective, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{objective}</span>
                  <button
                    type="button"
                    onClick={() => removeObjective(objective)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prerequisites
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={prerequisiteInput}
                onChange={(e) => setPrerequisiteInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add prerequisite and press Enter"
              />
              <button
                type="button"
                onClick={addPrerequisite}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {formData.prerequisites.map((prerequisite, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{prerequisite}</span>
                  <button
                    type="button"
                    onClick={() => removePrerequisite(prerequisite)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (chapter ? 'Update Chapter' : 'Create Chapter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  useEffect(() => {
    loadChapters();
    loadSubjects();
  }, []);

  const loadChapters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chapters?limit=1000', {
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
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subjects?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data.docs || data.data || []);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handleCreateChapter = async (formData: any) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const url = editingChapter ? `/api/chapters/${editingChapter._id}` : '/api/chapters';
      const method = editingChapter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setModalOpen(false);
        setEditingChapter(null);
        loadChapters();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save chapter');
      }
    } catch (error) {
      console.error('Error saving chapter:', error);
      alert('Failed to save chapter');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadChapters();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete chapter');
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('Failed to delete chapter');
    }
  };

  const filteredChapters = chapters.filter(chapter => {
    const matchesSearch = chapter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chapter.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !subjectFilter || chapter.subjectId._id === subjectFilter;
    const matchesDifficulty = !difficultyFilter || chapter.difficulty === difficultyFilter;
    
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'Easy': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Hard': 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
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
    <div className="p-6">
      {/* Header with Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <a
              href="/admin"
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </a>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Chapters Management</h1>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Chapter
          </button>
        </div>
        <p className="text-gray-600">Manage chapters within subjects</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search chapters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setSubjectFilter('');
              setDifficultyFilter('');
            }}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChapters.map((chapter) => (
          <div key={chapter._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpenIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{chapter.name}</h3>
                  <p className="text-sm text-gray-500">{chapter.code}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setEditingChapter(chapter);
                    setModalOpen(true);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteChapter(chapter._id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Subject:</span> {chapter.subjectId.name}
              </p>
              {chapter.description && (
                <div className="text-sm text-gray-600">
                  <RichTextRenderer content={chapter.description} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Chapter {chapter.chapterNumber}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(chapter.difficulty)}`}>
                {chapter.difficulty}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${chapter.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {chapter.isActive ? 'Active' : 'Inactive'}
              </span>
              {chapter.weightage > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {chapter.weightage}% weightage
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-900">{chapter.stats.totalTopics}</div>
                <div className="text-gray-600">Topics</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-900">{chapter.stats.totalQuestions}</div>
                <div className="text-gray-600">Questions</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-900">{chapter.stats.totalExams}</div>
                <div className="text-gray-600">Exams</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-900">{chapter.stats.totalPracticeTests}</div>
                <div className="text-gray-600">Practice Tests</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Created by {chapter.createdBy?.firstName} {chapter.createdBy?.lastName}</span>
                <span>{new Date(chapter.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredChapters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BookOpenIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No chapters found</h3>
          <p className="text-gray-600">Create your first chapter to get started</p>
        </div>
      )}

      <CreateChapterModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingChapter(null);
        }}
        onSubmit={handleCreateChapter}
        loading={saving}
        chapter={editingChapter}
        subjects={subjects}
      />
    </div>
  );
} 