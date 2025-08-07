'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ImportedQuestion {
  id: string;
  questionText: string;
  questionType: 'MCQ_Single' | 'MCQ_Multiple' | 'TrueFalse' | 'Integer' | 'Numerical';
  subject: string;
  chapter: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
  options?: string[];
  correctAnswer: string | string[] | number | boolean;
  explanation: string;
  questionImages?: string[];
  optionImages?: string[];
  explanationImages?: string[];
  tags: string[];
  status: 'valid' | 'invalid' | 'duplicate';
  errors?: string[];
}

export default function QuestionImport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedQuestions, setImportedQuestions] = useState<ImportedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'preview' | 'import'>('preview');

  // Check authentication
  React.useEffect(() => {
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
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/');
    }
  }, [router]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
      alert('Please upload a CSV or Excel file');
      return;
    }
    
    setSelectedFile(file);
    processFile(file);
  };

  const processFile = async (file: File) => {
    setUploadStatus('processing');
    
    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock imported questions
      const mockImportedQuestions: ImportedQuestion[] = [
        {
          id: '1',
          questionText: 'A particle moves along a straight line with velocity v = 3t² - 6t + 2 m/s. The acceleration of the particle at t = 2s is:',
          questionType: 'MCQ_Single',
          subject: 'Physics',
          chapter: 'Kinematics',
          topic: 'Motion in One Dimension',
          difficulty: 'Medium',
          marksPerQuestion: 4,
          negativeMarksPerQuestion: 1,
          options: ['6 m/s²', '8 m/s²', '10 m/s²', '12 m/s²'],
          correctAnswer: '6 m/s²',
          explanation: 'Acceleration is the derivative of velocity.',
          tags: ['kinematics', 'derivatives'],
          status: 'valid'
        },
        {
          id: '2',
          questionText: 'The value of ∫(x² + 2x + 1)dx from 0 to 2 is:',
          questionType: 'Numerical',
          subject: 'Mathematics',
          chapter: 'Calculus',
          topic: 'Integration',
          difficulty: 'Easy',
          marksPerQuestion: 3,
          negativeMarksPerQuestion: 0,
          correctAnswer: 8,
          explanation: '∫(x² + 2x + 1)dx = (x³/3 + x² + x) from 0 to 2 = 8',
          tags: ['calculus', 'integration'],
          status: 'valid'
        },
        {
          id: '3',
          questionText: 'Match the following:\nColumn I: A) HCl B) H₂SO₄ C) HNO₃\nColumn II: 1) Monobasic 2) Dibasic 3) Tribasic',
          questionType: 'MCQ_Multiple',
          subject: 'Chemistry',
          chapter: 'Acids and Bases',
          topic: 'Types of Acids',
          difficulty: 'Medium',
          marksPerQuestion: 4,
          negativeMarksPerQuestion: 1,
          correctAnswer: ['A-1', 'B-2', 'C-1'],
          explanation: 'HCl is monobasic, H₂SO₄ is dibasic, HNO₃ is monobasic',
          tags: ['acids', 'basicity'],
          status: 'valid'
        },
        {
          id: '4',
          questionText: 'What is the capital of France?',
          questionType: 'MCQ_Single',
          subject: 'General Knowledge',
          chapter: 'Geography',
          topic: 'Countries and Capitals',
          difficulty: 'Easy',
          marksPerQuestion: 2,
          negativeMarksPerQuestion: 0,
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 'Paris',
          explanation: 'Paris is the capital of France.',
          tags: ['geography', 'capitals'],
          status: 'duplicate'
        },
        {
          id: '5',
          questionText: '',
          questionType: 'MCQ_Single',
          subject: '',
          chapter: '',
          topic: '',
          difficulty: 'Easy',
          marksPerQuestion: 0,
          negativeMarksPerQuestion: 0,
          correctAnswer: '',
          explanation: '',
          tags: [],
          status: 'invalid',
          errors: ['Question text is required', 'Subject is required', 'Marks must be greater than 0']
        }
      ];
      
      setImportedQuestions(mockImportedQuestions);
      setUploadStatus('completed');
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadStatus('error');
    }
  };

  const handleImport = async () => {
    setLoading(true);
    
    try {
      const validQuestions = importedQuestions.filter(q => q.status === 'valid');
      console.log('Importing questions:', validQuestions);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully imported ${validQuestions.length} questions!`);
      router.push('/admin/questions');
    } catch (error) {
      console.error('Error importing questions:', error);
      alert('Error importing questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Create sample CSV content
    const csvContent = `questionText,questionType,subject,chapter,topic,difficulty,marksPerQuestion,negativeMarksPerQuestion,options,correctAnswer,explanation,tags
"A particle moves along a straight line with velocity v = 3t² - 6t + 2 m/s. The acceleration of the particle at t = 2s is:",MCQ_Single,Physics,Kinematics,Motion in One Dimension,Medium,4,1,"6 m/s²|8 m/s²|10 m/s²|12 m/s²",6 m/s²,"Acceleration is the derivative of velocity.","kinematics|derivatives"
"The value of ∫(x² + 2x + 1)dx from 0 to 2 is:",Numerical,Mathematics,Calculus,Integration,Easy,3,0,,8,"∫(x² + 2x + 1)dx = (x³/3 + x² + x) from 0 to 2 = 8","calculus|integration"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'duplicate':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'invalid':
        return 'bg-red-100 text-red-800';
      case 'duplicate':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const validQuestions = importedQuestions.filter(q => q.status === 'valid');
  const invalidQuestions = importedQuestions.filter(q => q.status === 'invalid');
  const duplicateQuestions = importedQuestions.filter(q => q.status === 'duplicate');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Question Import/Export</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/admin/questions" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Questions
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/admin/questions"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Questions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Import/Export Questions</h1>
          <p className="text-gray-600 mt-2">
            Import questions from CSV/Excel files or export existing questions.
          </p>
        </div>

        {/* Import/Export Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Import Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center mb-4">
              <CloudArrowUpIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Import Questions</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Supported Formats</h3>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    CSV
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Excel (.xlsx)
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Excel (.xls)
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Required Columns</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• questionText (required)</div>
                  <div>• questionType: MCQ_Single, MCQ_Multiple, TrueFalse, Integer, Numerical</div>
                  <div>• subject, chapter, topic (required)</div>
                  <div>• difficulty: Easy, Medium, Hard</div>
                  <div>• marksPerQuestion, negativeMarksPerQuestion (numbers)</div>
                  <div>• options (pipe-separated for MCQ)</div>
                  <div>• correctAnswer</div>
                  <div>• explanation (required)</div>
                  <div>• tags (pipe-separated)</div>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                
                {uploadStatus === 'idle' && (
                  <div>
                    <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drag and drop your file here, or{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-sm text-gray-500">CSV, Excel files up to 10MB</p>
                  </div>
                )}

                {uploadStatus === 'processing' && (
                  <div>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Processing your file...</p>
                  </div>
                )}

                {uploadStatus === 'completed' && (
                  <div>
                    <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-gray-600">File processed successfully!</p>
                    <p className="text-sm text-gray-500">
                      {validQuestions.length} valid, {invalidQuestions.length} invalid, {duplicateQuestions.length} duplicate
                    </p>
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div>
                    <XCircleIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <p className="text-red-600">Error processing file</p>
                    <button
                      onClick={() => setUploadStatus('idle')}
                      className="mt-2 text-blue-600 hover:text-blue-700"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Export Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center mb-4">
              <CloudArrowDownIcon className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Export Questions</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Export Options</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Download Template
                  </button>
                  <button
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <CloudArrowDownIcon className="h-4 w-4 mr-2" />
                    Export All Questions
                  </button>
                  <button
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Export by Subject
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Export Features</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Export all questions or filter by subject/chapter</li>
                  <li>• Download as CSV or Excel format</li>
                  <li>• Include question metadata and statistics</li>
                  <li>• Batch export for backup purposes</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Import Preview */}
        {importedQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Import Preview</h2>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">{validQuestions.length} Valid</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircleIcon className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-600">{invalidQuestions.length} Invalid</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">{duplicateQuestions.length} Duplicate</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importedQuestions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(question.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(question.status)}`}>
                            {question.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {question.questionText.substring(0, 80)}...
                        </div>
                        {question.errors && (
                          <div className="mt-1 text-xs text-red-600">
                            {question.errors.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {question.questionType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {question.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {question.marksPerQuestion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import Actions */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {validQuestions.length > 0 ? (
                    <span>Ready to import {validQuestions.length} valid questions</span>
                  ) : (
                    <span>No valid questions to import</span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setImportedQuestions([])}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={validQuestions.length === 0 || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Importing...' : `Import ${validQuestions.length} Questions`}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 