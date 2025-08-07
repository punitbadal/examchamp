'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[150px] border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading editor...</div>
    </div>
  ),
}) as any;

interface ReactQuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const ReactQuillEditor: React.FC<ReactQuillEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  className = '',
  readOnly = false
}) => {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [showMathDialog, setShowMathDialog] = useState(false);
  const [mathFormula, setMathFormula] = useState('');
  const [mathType, setMathType] = useState<'inline' | 'block'>('inline');
  const quillRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to handle image upload
  const uploadImage = async (file: File): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        return result.url;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  // Custom image handler for ReactQuill
  const imageHandler = useCallback(async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          setUploadingImage(true);
          const imageUrl = await uploadImage(file);
          
          const quill = quillRef.current?.getEditor();
          const range = quill?.getSelection();
          if (range) {
            quill?.insertEmbed(range.index, 'image', imageUrl);
          }
        } catch (error) {
          console.error('Failed to upload image:', error);
          alert('Failed to upload image. Please try again.');
        } finally {
          setUploadingImage(false);
        }
      }
    };
  }, []);

  // Custom math formula handler
  const mathHandler = useCallback(() => {
    setShowMathDialog(true);
    setMathFormula('');
    setMathType('inline');
  }, []);

  // Insert math formula
  const insertMathFormula = () => {
    if (!mathFormula.trim()) return;

    const quill = quillRef.current?.getEditor();
    const range = quill?.getSelection();
    
    if (range) {
      let formulaText = '';
      if (mathType === 'inline') {
        formulaText = `$${mathFormula}$`;
      } else {
        formulaText = `$$\n${mathFormula}\n$$`;
      }
      
      quill?.insertText(range.index, formulaText);
    }
    
    setShowMathDialog(false);
    setMathFormula('');
  };

  // ReactQuill modules configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image', 'formula'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
        formula: mathHandler
      }
    },
    clipboard: {
      matchVisual: false,
    }
  };

  // ReactQuill formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link', 'image', 'formula'
  ];

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="w-full min-h-[150px] border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`react-quill-editor ${className}`} ref={containerRef}>
      {uploadingImage && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          Uploading image...
        </div>
      )}
      
      <div className="quill-container" style={{ border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }}>
        <ReactQuill
          key={`quill-editor-${editorKey}`}
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{ height: '200px' }}
        />
      </div>

      {/* Math Formula Dialog */}
      {showMathDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Insert Math Formula</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formula Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="inline"
                      checked={mathType === 'inline'}
                      onChange={(e) => setMathType(e.target.value as 'inline' | 'block')}
                      className="mr-2"
                    />
                    Inline
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="block"
                      checked={mathType === 'block'}
                      onChange={(e) => setMathType(e.target.value as 'inline' | 'block')}
                      className="mr-2"
                    />
                    Block
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LaTeX Formula
                </label>
                {mathType === 'block' ? (
                  <textarea
                    value={mathFormula}
                    onChange={(e) => setMathFormula(e.target.value)}
                    placeholder="Enter LaTeX formula (e.g., \frac{-b \pm \sqrt{b^2-4ac}}{2a})"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                ) : (
                  <input
                    type="text"
                    value={mathFormula}
                    onChange={(e) => setMathFormula(e.target.value)}
                    placeholder="Enter LaTeX formula (e.g., x^2 + y^2 = z^2)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>

              {/* Preview */}
              {mathFormula.trim() && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs text-gray-600 mb-2">Preview:</p>
                  <div className="flex items-center justify-center">
                    <div className="text-lg">
                      {mathType === 'block' ? (
                        <div className="text-center">
                          {`$$\n${mathFormula}\n$$`}
                        </div>
                      ) : (
                        `$${mathFormula}$`
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* LaTeX Help */}
              <div className="text-xs text-gray-500">
                <p className="font-medium mb-1">Common LaTeX symbols:</p>
                <div className="grid grid-cols-2 gap-1">
                  <span>Fractions: \frac&#123;a&#125;&#123;b&#125;</span>
                  <span>Square root: \sqrt&#123;x&#125;</span>
                  <span>Power: x^2</span>
                  <span>Subscript: x_1</span>
                  <span>Greek: \alpha, \beta, \pi</span>
                  <span>Integral: \int</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowMathDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={insertMathFormula}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactQuillEditor; 