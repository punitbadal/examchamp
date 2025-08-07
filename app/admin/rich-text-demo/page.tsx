'use client';

import React, { useState } from 'react';
import RichTextEditor from '../../components/RichTextEditor';

export default function RichTextDemo() {
  const [content, setContent] = useState('');

  const handleImageUpload = async (file: File): Promise<string> => {
    // Simulate image upload - in real app, upload to your server
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Rich Text Editor Demo</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Math Pasting</h2>
        <p className="text-gray-600 mb-4">
          Try pasting mathematical content like: "Let x = 2 and y = 3. Then x^2 + y^2 = 13"
        </p>
        
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h3 className="font-semibold mb-2">Sample content to copy and paste:</h3>
          <div className="space-y-2 text-sm">
            <div className="bg-white p-2 rounded border">
              <strong>Basic math:</strong> Let x = 2 and y = 3. Then x^2 + y^2 = 13
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>Fractions:</strong> The fraction 1/2 plus 1/3 equals 5/6
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>Trigonometry:</strong> sin(θ) + cos(θ) = 1
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>Greek letters:</strong> α + β = γ
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>Mathematical symbols:</strong> x ≤ y and x ≠ 0
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Rich Text Editor</h2>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Start typing or paste mathematical content..."
          onImageUpload={handleImageUpload}
          className="min-h-[400px]"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Generated HTML</h2>
        <div className="bg-gray-100 p-4 rounded">
          <pre className="text-sm overflow-x-auto">{content}</pre>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Rendered Output</h2>
        <div 
          className="bg-white p-4 rounded border"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
} 