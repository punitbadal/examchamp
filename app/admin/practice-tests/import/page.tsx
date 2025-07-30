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
  TrashIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ImportedPracticeTest {
  id: string;
  title: string;
  description: string;
  subject: string;
  totalQuestions: number;
  totalMarks: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isPaid: boolean;
  price: number;
  currency: string;
  tags: string[];
  status: 'valid' | 'invalid' | 'duplicate';
  errors?: string[];
}

export default function PracticeTestImport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedTests, setImportedTests] = useState<ImportedPracticeTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      
      // Mock imported practice tests
      const mockImportedTests: ImportedPracticeTest[] = [
        {
          id: '1',
          title: 'JEE Main Physics Practice Test',
          description: 'Comprehensive physics practice test covering all JEE Main topics',
          subject: 'Physics',
          totalQuestions: 25,
          totalMarks: 100,
          duration: 60,
          difficulty: 'medium',
          isPaid: false,
          price: 0,
          currency: 'INR',
          tags: ['jee-main', 'physics', 'practice'],
          status: 'valid'
        },
        {
          id: '2',
          title: 'NEET Biology Mock Test',
          description: 'Full-length biology test for NEET preparation',
          subject: 'Biology',
          totalQuestions: 45,
          totalMarks: 180,
          duration: 50,
          difficulty: 'hard',
          isPaid: true,
          price: 99,
          currency: 'INR',
          tags: ['neet', 'biology', 'mock'],
          status: 'valid'
        },
        {
          id: '3',
          title: 'CAT Quantitative Aptitude',
          description: 'Quantitative aptitude questions for CAT preparation',
          subject: 'Mathematics',
          totalQuestions: 34,
          totalMarks: 100,
          duration: 60,
          difficulty: 'medium',
          isPaid: true,
          price: 149,
          currency: 'INR',
          tags: ['cat', 'quant', 'aptitude'],
          status: 'valid'
        },
        {
          id: '4',
          title: 'JEE Main Physics Practice Test',
          description: 'Duplicate test with same title',
          subject: 'Physics',
          totalQuestions: 25,
          totalMarks: 100,
          duration: 60,
          difficulty: 'medium',
          isPaid: false,
          price: 0,
          currency: 'INR',
          tags: ['jee-main', 'physics', 'practice'],
          status: 'duplicate'
        },
        {
          id: '5',
          title: '',
          description: '',
          subject: '',
          totalQuestions: 0,
          totalMarks: 0,
          duration: 0,
          difficulty: 'easy',
          isPaid: false,
          price: 0,
          currency: 'INR',
          tags: [],
          status: 'invalid',
          errors: ['Title is required', 'Subject is required', 'Total questions must be greater than 0', 'Duration must be greater than 0']
        }
      ];
      
      setImportedTests(mockImportedTests);
      setUploadStatus('completed');
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadStatus('error');
    }
  };

  const handleImport = async () => {
    setLoading(true);
    
    try {
      const validTests = importedTests.filter(t => t.status === 'valid');
      console.log('Importing practice tests:', validTests);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully imported ${validTests.length} practice tests!`);
      router.push('/admin/practice-tests');
    } catch (error) {
      console.error('Error importing practice tests:', error);
      alert('Error importing practice tests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Create sample CSV content for practice tests
    const csvContent = `title,description,subject,totalQuestions,totalMarks,duration,difficulty,isPaid,price,currency,tags
"JEE Main Physics Practice Test","Comprehensive physics practice test covering all JEE Main topics",Physics,25,100,60,medium,false,0,INR,"jee-main|physics|practice"
"NEET Biology Mock Test","Full-length biology test for NEET preparation",Biology,45,180,50,hard,true,99,INR,"neet|biology|mock"
"CAT Quantitative Aptitude","Quantitative aptitude questions for CAT preparation",Mathematics,34,100,60,medium,true,149,INR,"cat|quant|aptitude"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'practice_test_template.csv';
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const validTests = importedTests.filter(t => t.status === 'valid');
  const invalidTests = importedTests.filter(t => t.status === 'invalid');
  const duplicateTests = importedTests.filter(t => t.status === 'duplicate');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Practice Test Import/Export</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/admin/practice-tests" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Practice Tests
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
            href="/admin/practice-tests"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Practice Tests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Import/Export Practice Tests</h1>
          <p className="text-gray-600 mt-2">
            Import practice tests from CSV/Excel files or export existing tests.
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
              <h2 className="text-xl font-semibold text-gray-900">Import Practice Tests</h2>
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
                  <div>• title (required)</div>
                  <div>• description (required)</div>
                  <div>• subject (required)</div>
                  <div>• totalQuestions (number, required)</div>
                  <div>• totalMarks (number, required)</div>
                  <div>• duration (minutes, required)</div>
                  <div>• difficulty: easy, medium, hard</div>
                  <div>• isPaid: true/false</div>
                  <div>• price (number, if paid)</div>
                  <div>• currency: INR, USD, EUR</div>
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
                      {validTests.length} valid, {invalidTests.length} invalid, {duplicateTests.length} duplicate
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
              <h2 className="text-xl font-semibold text-gray-900">Export Practice Tests</h2>
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
                    Export All Tests
                  </button>
                  <button
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Export by Subject
                  </button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">Export Features</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Export all practice tests or filter by subject</li>
                  <li>• Download as CSV or Excel format</li>
                  <li>• Include test metadata and statistics</li>
                  <li>• Batch export for backup purposes</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Import Preview */}
        {importedTests.length > 0 && (
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
                    <span className="text-sm text-gray-600">{validTests.length} Valid</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircleIcon className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-600">{invalidTests.length} Invalid</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">{duplicateTests.length} Duplicate</span>
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
                      Test Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importedTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(test.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(test.status)}`}>
                            {test.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {test.title || 'No title'}
                        </div>
                        {test.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {test.description.substring(0, 60)}...
                          </div>
                        )}
                        {test.errors && (
                          <div className="mt-1 text-xs text-red-600">
                            {test.errors.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.totalQuestions} ({test.totalMarks} marks)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.duration} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(test.difficulty)}`}>
                          {test.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.isPaid ? `${test.currency} ${test.price}` : 'Free'}
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
                  {validTests.length > 0 ? (
                    <span>Ready to import {validTests.length} valid practice tests</span>
                  ) : (
                    <span>No valid practice tests to import</span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setImportedTests([])}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={validTests.length === 0 || loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Importing...' : `Import ${validTests.length} Practice Tests`}
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