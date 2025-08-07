'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

// Math detection and conversion functions
const detectMathContent = (text: string): string[] => {
  const mathPatterns = [
    // Common mathematical expressions
    /\b(sin|cos|tan|log|ln|sqrt|sum|prod|int|lim|infinity|pi|theta|alpha|beta|gamma|delta|epsilon|phi|omega)\b/gi,
    // Fractions like a/b
    /\b\d+\/\d+\b/g,
    // Powers like x^2, x^3
    /\b\w+\^\d+\b/g,
    // Subscripts like x_1, x_2
    /\b\w+_\d+\b/g,
    // Greek letters
    /[αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ]/g,
    // Mathematical symbols
    /[±×÷√∑∏∫∂∞≈≠≤≥]/g
  ];
  
  const detectedMath: string[] = [];
  mathPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      detectedMath.push(...matches);
    }
  });
  
  return [...new Set(detectedMath)];
};

const convertToLaTeX = (text: string): string => {
  let latex = text;
  
  // Convert common mathematical expressions to LaTeX
  const conversions: { [key: string]: string } = {
    'sin': '\\sin',
    'cos': '\\cos', 
    'tan': '\\tan',
    'log': '\\log',
    'ln': '\\ln',
    'sqrt': '\\sqrt',
    'sum': '\\sum',
    'prod': '\\prod',
    'int': '\\int',
    'lim': '\\lim',
    'infinity': '\\infty',
    'pi': '\\pi',
    'theta': '\\theta',
    'alpha': '\\alpha',
    'beta': '\\beta',
    'gamma': '\\gamma',
    'delta': '\\delta',
    'epsilon': '\\epsilon',
    'phi': '\\phi',
    'omega': '\\omega',
    '±': '\\pm',
    '×': '\\times',
    '÷': '\\div',
    '√': '\\sqrt',
    '∑': '\\sum',
    '∏': '\\prod',
    '∫': '\\int',
    '∂': '\\partial',
    '∞': '\\infty',
    '≈': '\\approx',
    '≠': '\\neq',
    '≤': '\\leq',
    '≥': '\\geq'
  };
  
  Object.entries(conversions).forEach(([original, latexCmd]) => {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    latex = latex.replace(regex, latexCmd);
  });
  
  // Handle fractions (a/b -> \frac{a}{b})
  latex = latex.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
  
  // Handle powers (x^2 -> x^{2})
  latex = latex.replace(/(\w+)\^(\d+)/g, '$1^{$2}');
  
  // Handle subscripts (x_1 -> x_{1})
  latex = latex.replace(/(\w+)_(\d+)/g, '$1_{$2}');
  
  return latex;
};

// Simple math insertion function
const insertMath = (editor: any, content: string, isBlock: boolean = false) => {
  const mathText = isBlock ? `$$${content}$$` : `$${content}$`;
  editor.commands.insertContent(mathText);
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  className = '',
  readOnly = false,
  onImageUpload
}) => {
  const [showMathInput, setShowMathInput] = useState(false);
  const [mathInput, setMathInput] = useState('');
  const [mathType, setMathType] = useState<'inline' | 'block'>('inline');
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      BulletList,
      OrderedList,
      ListItem,
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Enhanced paste handling for mathematical content
  useEffect(() => {
    if (!editor) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      // Check for images first
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file && onImageUpload) {
            try {
              setUploadingImage(true);
              const imageUrl = await onImageUpload(file);
              editor.chain().focus().setImage({ src: imageUrl }).run();
            } catch (error) {
              console.error('Failed to upload pasted image:', error);
            } finally {
              setUploadingImage(false);
            }
          }
          return;
        }
      }

      // Handle text content with math detection
      const text = event.clipboardData?.getData('text/plain');
      if (text) {
        const detectedMath = detectMathContent(text);
        
        if (detectedMath.length > 0) {
          event.preventDefault();
          
          // If significant math content is detected, convert to LaTeX
          const mathRatio = detectedMath.length / text.split(' ').length;
          
          if (mathRatio > 0.1) { // If more than 10% of content is math
            const latexContent = convertToLaTeX(text);
            const mathBlock = `$$${latexContent}$$`;
            editor.commands.insertContent(mathBlock);
          } else {
            // Insert as regular text but highlight potential math
            editor.commands.insertContent(text);
          }
        }
      }
    };

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          if (onImageUpload) {
            try {
              setUploadingImage(true);
              const imageUrl = await onImageUpload(file);
              editor.chain().focus().setImage({ src: imageUrl }).run();
            } catch (error) {
              console.error('Failed to upload dropped image:', error);
            } finally {
              setUploadingImage(false);
            }
          }
          break;
        }
      }
    };

    editor.view.dom.addEventListener('paste', handlePaste);
    editor.view.dom.addEventListener('drop', handleDrop);

    return () => {
      editor.view.dom.removeEventListener('paste', handlePaste);
      editor.view.dom.removeEventListener('drop', handleDrop);
    };
  }, [editor, onImageUpload]);

  if (!editor) {
    return null;
  }

  const addMath = () => {
    if (mathInput.trim()) {
      insertMath(editor, mathInput.trim(), mathType === 'block');
      setMathInput('');
      setShowMathInput(false);
    }
  };

  const MenuBar = () => {
    if (readOnly) return null;

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && onImageUpload) {
        try {
          setUploadingImage(true);
          const imageUrl = await onImageUpload(file);
          editor.chain().focus().setImage({ src: imageUrl }).run();
        } catch (error) {
          console.error('Failed to upload image:', error);
        } finally {
          setUploadingImage(false);
        }
      }
    };

    return (
      <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-md">
        <div className="flex flex-wrap gap-1">
          {/* Text Formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded ${editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded ${editor.isActive('highlight') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Highlight"
          >
            <mark>H</mark>
          </button>

          <div className="w-px bg-gray-300 mx-1"></div>

          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Heading 3"
          >
            H3
          </button>

          <div className="w-px bg-gray-300 mx-1"></div>

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Bullet List"
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Numbered List"
          >
            1.
          </button>

          <div className="w-px bg-gray-300 mx-1"></div>

          {/* Text Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Align Left"
          >
            ←
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Align Center"
          >
            ↔
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Align Right"
          >
            →
          </button>

          <div className="w-px bg-gray-300 mx-1"></div>

          {/* Image Upload */}
          {onImageUpload && (
            <>
              <label className="p-2 rounded hover:bg-gray-100 cursor-pointer" title="Upload Image">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                📷
              </label>
              {uploadingImage && (
                <span className="p-2 text-sm text-gray-500">Uploading...</span>
              )}
            </>
          )}

          <div className="w-px bg-gray-300 mx-1"></div>

          {/* Math */}
          <button
            onClick={() => setShowMathInput(!showMathInput)}
            className="p-2 rounded hover:bg-gray-100"
            title="Add Math"
          >
            ∑
          </button>
        </div>

        {/* Math Input */}
        {showMathInput && (
          <div className="mt-2 p-3 bg-white border border-gray-300 rounded-md">
            <div className="flex gap-2 mb-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="inline"
                  checked={mathType === 'inline'}
                  onChange={(e) => setMathType(e.target.value as 'inline' | 'block')}
                  className="mr-1"
                />
                Inline Math
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="block"
                  checked={mathType === 'block'}
                  onChange={(e) => setMathType(e.target.value as 'inline' | 'block')}
                  className="mr-1"
                />
                Block Math
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                placeholder="Enter LaTeX math expression..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addMath()}
              />
              <button
                onClick={addMath}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => setShowMathInput(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
            {mathInput && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Preview:</div>
                {mathType === 'inline' ? (
                  <InlineMath math={mathInput} />
                ) : (
                  <BlockMath math={mathInput} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      <MenuBar />
      <div className="p-3 min-h-[200px] max-h-[400px] overflow-y-auto">
        <EditorContent 
          editor={editor} 
          className="prose prose-sm max-w-none focus:outline-none"
        />
      </div>
    </div>
  );
};

export default RichTextEditor; 