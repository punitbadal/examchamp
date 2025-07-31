'use client';

import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, XCircle, FileText, Users, BookOpen, Target } from 'lucide-react';

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('csv', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bulk-import/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bulk-import/template', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bulk-import-template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'categories':
        return <Users className="h-4 w-4" />;
      case 'subjects':
        return <BookOpen className="h-4 w-4" />;
      case 'chapters':
        return <FileText className="h-4 w-4" />;
      case 'topics':
        return <Target className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk Import Content</h1>
        <p className="text-gray-600">
          Import categories, subjects, chapters, and topics from a CSV file. 
          Download the template to see the required format.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>

              <button
                onClick={downloadTemplate}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Import Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(results.details).map(([type, data]: [string, any]) => (
                <div key={type} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    {getIconForType(type)}
                    <h4 className="font-semibold text-gray-900 capitalize ml-2">{type}</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Created: {data.created}
                    </div>
                    <div className="flex items-center text-yellow-600">
                      <XCircle className="h-4 w-4 mr-1" />
                      Skipped: {data.skipped}
                    </div>
                    {data.errors.length > 0 && (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Errors: {data.errors.length}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-blue-900 mb-2">Summary</h4>
              <div className="text-sm text-blue-800">
                <p>Total Created: {results.summary.totalCreated}</p>
                <p>Total Skipped: {results.summary.totalSkipped}</p>
                <p>Total Errors: {results.summary.totalErrors}</p>
              </div>
            </div>

            {results.details.topics.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <h4 className="font-semibold text-red-900 mb-2">Error Details</h4>
                <div className="text-sm text-red-800 max-h-40 overflow-y-auto">
                  {results.details.topics.errors.slice(0, 5).map((error: string, index: number) => (
                    <p key={index} className="mb-1">• {error}</p>
                  ))}
                  {results.details.topics.errors.length > 5 && (
                    <p className="text-xs text-red-600 mt-2">
                      ... and {results.details.topics.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>1. <strong>Download Template:</strong> Click "Download Template" to get the CSV structure</p>
          <p>2. <strong>Fill CSV:</strong> Add your data following the template format</p>
          <p>3. <strong>Upload:</strong> Select the CSV file and click "Upload CSV"</p>
          <p>4. <strong>Review Results:</strong> Check the import summary and any errors</p>
          <p>5. <strong>Verify:</strong> Navigate to the admin pages to verify created content</p>
        </div>
      </div>
    </div>
  );
} 