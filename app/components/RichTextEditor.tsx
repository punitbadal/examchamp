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
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

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
  readOnly = false
}) => {
  const [showMathInput, setShowMathInput] = useState(false);
  const [mathInput, setMathInput] = useState('');
  const [mathType, setMathType] = useState<'inline' | 'block'>('inline');

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