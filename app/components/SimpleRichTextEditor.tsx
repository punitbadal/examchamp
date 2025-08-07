'use client';

import React, { useState, useRef } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
  QrCodeIcon,
  PhotoIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  className = '',
  readOnly = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const insertText = (text: string) => {
    if (!textareaRef.current || readOnly) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText = '';
    if (text === '**' || text === '__') {
      // Bold
      newText = value.substring(0, start) + `**${selectedText || 'bold text'}**` + value.substring(end);
    } else if (text === '*' || text === '_') {
      // Italic
      newText = value.substring(0, start) + `*${selectedText || 'italic text'}*` + value.substring(end);
    } else if (text === '~~') {
      // Strikethrough
      newText = value.substring(0, start) + `~~${selectedText || 'strikethrough text'}~~` + value.substring(end);
    } else if (text === '`') {
      // Inline code
      newText = value.substring(0, start) + `\`${selectedText || 'code'}\`` + value.substring(end);
    } else if (text === '```') {
      // Code block
      newText = value.substring(0, start) + `\`\`\`\n${selectedText || 'code block'}\n\`\`\`` + value.substring(end);
    } else if (text === '> ') {
      // Quote
      newText = value.substring(0, start) + `> ${selectedText || 'quote'}` + value.substring(end);
    } else if (text === '- ') {
      // Bullet list
      newText = value.substring(0, start) + `- ${selectedText || 'list item'}` + value.substring(end);
    } else if (text === '1. ') {
      // Numbered list
      newText = value.substring(0, start) + `1. ${selectedText || 'list item'}` + value.substring(end);
    } else {
      newText = value.substring(0, start) + text + value.substring(end);
    }
    
    onChange(newText);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + text.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

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

  const handleImageUpload = async () => {
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
          insertText(`![${file.name}](${imageUrl})`);
        } catch (error) {
          console.error('Failed to upload image:', error);
          alert('Failed to upload image. Please try again.');
        } finally {
          setUploadingImage(false);
        }
      }
    };
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            setUploadingImage(true);
            const imageUrl = await uploadImage(file);
            insertText(`![pasted image](${imageUrl})`);
          } catch (error) {
            console.error('Failed to upload pasted image:', error);
            alert('Failed to upload pasted image. Please try again.');
          } finally {
            setUploadingImage(false);
          }
        }
        break;
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          setUploadingImage(true);
          const imageUrl = await uploadImage(file);
          insertText(`![${file.name}](${imageUrl})`);
        } catch (error) {
          console.error('Failed to upload dropped image:', error);
          alert('Failed to upload dropped image. Please try again.');
        } finally {
          setUploadingImage(false);
        }
        break;
      }
    }
  };

  return (
    <div className={`simple-rich-text-editor ${className}`}>
      {uploadingImage && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          Uploading image...
        </div>
      )}
      
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-md">
        <button
          type="button"
          onClick={() => insertText('**')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Bold"
        >
          <BoldIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertText('*')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Italic"
        >
          <ItalicIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertText('~~')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Strikethrough"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => insertText('- ')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          <ListBulletIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertText('1. ')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          <HashtagIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertText('> ')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Quote"
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertText('`')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Inline Code"
        >
          <QrCodeIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={handleImageUpload}
          disabled={uploadingImage}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
          title="Insert Image"
        >
          <PhotoIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        onPaste={handlePaste}
        onDrop={handleDrop}
        className="w-full min-h-[150px] p-3 border border-gray-300 rounded-b-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
        style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5' }}
      />
      
      {/* Help text */}
      <div className="mt-1 text-xs text-gray-500">
        <strong>Markdown shortcuts:</strong> **bold**, *italic*, ~~strikethrough~~, `code`, ```code block```, &gt; quote, - list, 1. numbered list
      </div>
    </div>
  );
};

export default SimpleRichTextEditor; 