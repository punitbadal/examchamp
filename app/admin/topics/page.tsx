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
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import RichTextEditor from '../../components/RichTextEditor';
import RichTextRenderer from '../../components/RichTextRenderer';

interface Topic {
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
  chapterId: {
    _id: string;
    name: string;
    code: string;
    chapterNumber: number;
  };
  chapterName: string;
  topicNumber: number;
  difficulty: string;
  weightage: number;
  estimatedHours: number;
  isActive: boolean;
  order: number;
  content: string;
  learningObjectives: string[];
  keyConcepts: string[];
  formulas: string[];
  examples: Array<{
    title: string;
    description: string;
    solution: string;
  }>;
  stats: {
    totalQuestions: number;
    totalExams: number;
    totalPracticeTests: number;
    averageScore: number;
    totalAttempts: number;
    questionDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
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

interface Chapter {
  _id: string;
  name: string;
  code: string;
  chapterNumber: number;
  subjectId: string | {
    _id: string;
    name: string;
    code: string;
    category: string;
  };
}

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
  topic?: Topic;
  subjects: Subject[];
  chapters: Chapter[];
}

const CreateTopicModal: React.FC<CreateTopicModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading, 
  topic,
  subjects,
  chapters
}) => {
  const [formData, setFormData] = useState({
    name: topic?.name || '',
    code: topic?.code || '',
    description: topic?.description || '',
    subjectId: topic?.subjectId?._id || '',
    chapterId: topic?.chapterId?._id || '',
    topicNumber: topic?.topicNumber || 1,
    difficulty: topic?.difficulty || 'Medium',
    weightage: topic?.weightage || 0,
    estimatedHours: topic?.estimatedHours || 0,
    order: topic?.order || 0,
    content: topic?.content || '',
    learningObjectives: topic?.learningObjectives || [],
    keyConcepts: topic?.keyConcepts || [],
    formulas: topic?.formulas || [],
    examples: topic?.examples || []
  });

  // Auto-populate topic code when subject and chapter change
  useEffect(() => {
    if (formData.subjectId && formData.chapterId && !topic) { // Only auto-populate for new topics
      const selectedSubject = subjects.find(subject => subject._id === formData.subjectId);
      const selectedChapter = chapters.find(chapter => chapter._id === formData.chapterId);
      
      if (selectedSubject && selectedChapter) {
        setFormData(prev => ({
          ...prev,
          code: `${selectedSubject.code}-${selectedChapter.code}-`
        }));
      }
    }
  }, [formData.subjectId, formData.chapterId, subjects, chapters, topic]);

  const [objectiveInput, setObjectiveInput] = useState('');
  const [conceptInput, setConceptInput] = useState('');
  const [formulaInput, setFormulaInput] = useState('');
  const [exampleInput, setExampleInput] = useState({ title: '', description: '', solution: '' });

  const filteredChapters = chapters.filter(chapter => {
    if (!formData.subjectId) return true;
    
    // Handle both string and object subjectId
    const chapterSubjectId = typeof chapter.subjectId === 'string' 
      ? chapter.subjectId 
      : chapter.subjectId._id;
    
    return chapterSubjectId === formData.subjectId;
  });

  // Debug logging
  useEffect(() => {
    console.log('Available chapters:', chapters);
    console.log('Selected subjectId:', formData.subjectId);
    console.log('Filtered chapters:', filteredChapters);
  }, [chapters, formData.subjectId, filteredChapters]);

  useEffect(() => {
    if (topic) {
      setFormData({
        name: topic.name,
        code: topic.code,
        description: topic.description,
        subjectId: topic.subjectId._id,
        chapterId: topic.chapterId._id,
        topicNumber: topic.topicNumber,
        difficulty: topic.difficulty,
        weightage: topic.weightage,
        estimatedHours: topic.estimatedHours,
        order: topic.order,
        content: topic.content,
        learningObjectives: topic.learningObjectives,
        keyConcepts: topic.keyConcepts,
        formulas: topic.formulas,
        examples: topic.examples
      });
    }
  }, [topic]);

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

  const addConcept = () => {
    if (conceptInput.trim() && !formData.keyConcepts.includes(conceptInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keyConcepts: [...prev.keyConcepts, conceptInput.trim()]
      }));
      setConceptInput('');
    }
  };

  const removeConcept = (conceptToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      keyConcepts: prev.keyConcepts.filter(concept => concept !== conceptToRemove)
    }));
  };

  const addFormula = () => {
    if (formulaInput.trim() && !formData.formulas.includes(formulaInput.trim())) {
      setFormData(prev => ({
        ...prev,
        formulas: [...prev.formulas, formulaInput.trim()]
      }));
      setFormulaInput('');
    }
  };

  const removeFormula = (formulaToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      formulas: prev.formulas.filter(formula => formula !== formulaToRemove)
    }));
  };

  const addExample = () => {
    if (exampleInput.title.trim() && exampleInput.description.trim()) {
      setFormData(prev => ({
        ...prev,
        examples: [...prev.examples, { ...exampleInput }]
      }));
      setExampleInput({ title: '', description: '', solution: '' });
    }
  };

  const removeExample = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, index) => index !== indexToRemove)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {topic ? 'Edit Topic' : 'Create New Topic'}
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
                Topic Name *
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
                Topic Code *
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    subjectId: e.target.value,
                    chapterId: '' // Reset chapter when subject changes
                  }));
                }}
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
                Chapter *
              </label>
              <select
                value={formData.chapterId}
                onChange={(e) => setFormData(prev => ({ ...prev, chapterId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!formData.subjectId}
              >
                <option value="">Select a chapter</option>
                {filteredChapters.map(chapter => (
                  <option key={chapter._id} value={chapter._id}>
                    {chapter.name} (Ch. {chapter.chapterNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic Number *
              </label>
              <input
                type="number"
                value={formData.topicNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, topicNumber: parseInt(e.target.value) || 1 }))}
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
              placeholder="Enter topic description with formatting, bullet points, and mathematical equations..."
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
              Content
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              placeholder="Enter topic content, explanations, and detailed information with formatting, bullet points, and mathematical equations..."
              className="w-full"
            />
          </div>

          {/* Learning Objectives */}
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

          {/* Key Concepts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Concepts
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={conceptInput}
                onChange={(e) => setConceptInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addConcept())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add key concept and press Enter"
              />
              <button
                type="button"
                onClick={addConcept}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {formData.keyConcepts.map((concept, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{concept}</span>
                  <button
                    type="button"
                    onClick={() => removeConcept(concept)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Formulas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formulas
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFormula())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add formula and press Enter"
              />
              <button
                type="button"
                onClick={addFormula}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {formData.formulas.map((formula, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-mono">{formula}</span>
                  <button
                    type="button"
                    onClick={() => removeFormula(formula)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Examples
            </label>
            <div className="border border-gray-300 rounded-md p-4 mb-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <input
                  type="text"
                  value={exampleInput.title}
                  onChange={(e) => setExampleInput(prev => ({ ...prev, title: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Example title"
                />
                <input
                  type="text"
                  value={exampleInput.description}
                  onChange={(e) => setExampleInput(prev => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Example description"
                />
                <input
                  type="text"
                  value={exampleInput.solution}
                  onChange={(e) => setExampleInput(prev => ({ ...prev, solution: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Solution"
                />
              </div>
              <button
                type="button"
                onClick={addExample}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Example
              </button>
            </div>
            <div className="space-y-2">
              {formData.examples.map((example, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{example.title}</h4>
                    <button
                      type="button"
                      onClick={() => removeExample(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{example.description}</p>
                  {example.solution && (
                    <p className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded">
                      Solution: {example.solution}
                    </p>
                  )}
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
              {loading ? 'Saving...' : (topic ? 'Update Topic' : 'Create Topic')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  useEffect(() => {
    loadTopics();
    loadSubjects();
    loadChapters();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/topics', {
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
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subjects', {
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

  const loadChapters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chapters', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChapters(data.data.docs || data.data || []);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const handleCreateTopic = async (formData: any) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const url = editingTopic ? `/api/topics/${editingTopic._id}` : '/api/topics';
      const method = editingTopic ? 'PUT' : 'POST';

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
        setEditingTopic(undefined);
        loadTopics();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save topic');
      }
    } catch (error) {
      console.error('Error saving topic:', error);
      alert('Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/topics/${topicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadTopics();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete topic');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
    }
  };

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !subjectFilter || topic.subjectId._id === subjectFilter;
    const matchesChapter = !chapterFilter || topic.chapterId._id === chapterFilter;
    const matchesDifficulty = !difficultyFilter || topic.difficulty === difficultyFilter;
    
    return matchesSearch && matchesSubject && matchesChapter && matchesDifficulty;
  });

  const filteredChapters = chapters.filter(chapter => {
    if (!subjectFilter) return true;
    
    // Handle both string and object subjectId
    const chapterSubjectId = typeof chapter.subjectId === 'string' 
      ? chapter.subjectId 
      : chapter.subjectId._id;
    
    return chapterSubjectId === subjectFilter;
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
            <h1 className="text-2xl font-bold text-gray-900">Topics Management</h1>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Topic
          </button>
        </div>
        <p className="text-gray-600">Manage topics within chapters</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setChapterFilter(''); // Reset chapter filter when subject changes
            }}
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
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={!subjectFilter}
          >
            <option value="">All Chapters</option>
            {filteredChapters.map(chapter => (
              <option key={chapter._id} value={chapter._id}>
                {chapter.name}
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
              setChapterFilter('');
              setDifficultyFilter('');
            }}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTopics.map((topic) => (
          <div key={topic._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                  <p className="text-sm text-gray-500">{topic.code}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setEditingTopic(topic);
                    setModalOpen(true);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTopic(topic._id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Subject:</span> {topic.subjectId.name}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Chapter:</span> {topic.chapterName}
              </p>
              {topic.description && (
                <div className="text-sm text-gray-600">
                  <RichTextRenderer content={topic.description} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Topic {topic.topicNumber}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(topic.difficulty)}`}>
                {topic.difficulty}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${topic.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {topic.isActive ? 'Active' : 'Inactive'}
              </span>
              {topic.weightage > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {topic.weightage}% weightage
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-900">{topic.stats.totalQuestions}</div>
                <div className="text-gray-600">Questions</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-900">{topic.stats.totalExams}</div>
                <div className="text-gray-600">Exams</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-900">{topic.stats.totalPracticeTests}</div>
                <div className="text-gray-600">Practice Tests</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-900">{topic.stats.averageScore.toFixed(1)}%</div>
                <div className="text-gray-600">Avg Score</div>
              </div>
            </div>

            {/* Question Distribution */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Question Distribution</h4>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                  Easy: {topic.stats.questionDistribution.easy}
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                  Medium: {topic.stats.questionDistribution.medium}
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                  Hard: {topic.stats.questionDistribution.hard}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Created by {topic.createdBy?.firstName} {topic.createdBy?.lastName}</span>
                <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <DocumentTextIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No topics found</h3>
          <p className="text-gray-600">Create your first topic to get started</p>
        </div>
      )}

      <CreateTopicModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTopic(undefined);
        }}
        onSubmit={handleCreateTopic}
        loading={saving}
        topic={editingTopic}
        subjects={subjects}
        chapters={chapters}
      />
    </div>
  );
} 