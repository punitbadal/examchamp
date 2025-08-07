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
        formula: () => {
          const formula = prompt('Enter LaTeX formula (e.g., x^2 + y^2 = z^2):');
          if (formula) {
            const quill = quillRef.current?.getEditor();
            const range = quill?.getSelection();
            if (range) {
              // Insert as a special math block
              quill?.insertText(range.index, `$${formula}$`);
            }
          }
        }
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
    </div>
  );
};

export default ReactQuillEditor; 