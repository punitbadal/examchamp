'use client';

import React, { useState } from 'react';
import RichTextEditor from '../../components/RichTextEditor';
import RichTextRenderer from '../../components/RichTextRenderer';

export default function RichTextDemoPage() {
  const [content, setContent] = useState(`
    <h1>Rich Text Editor Demo</h1>
    <p>This is a <strong>bold text</strong> and this is <em>italic text</em>.</p>
    <p>You can also add <u>underlined text</u> and <mark>highlighted text</mark>.</p>
    
    <h2>Mathematical Equations</h2>
    <p>Inline math: $E = mc^2$</p>
    <p>Block math:</p>
    <p>$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$</p>
    
    <h2>Chemical Equations</h2>
    <p>Chemical reaction: $2H_2 + O_2 \rightarrow 2H_2O$</p>
    <p>Equilibrium constant: $K_c = \frac{[C]^c[D]^d}{[A]^a[B]^b}$</p>
    
    <h2>Lists</h2>
    <ul>
      <li>Bullet point 1</li>
      <li>Bullet point 2</li>
      <li>Bullet point 3</li>
    </ul>
    
    <h2>Numbered Lists</h2>
    <ol>
      <li>First item</li>
      <li>Second item</li>
      <li>Third item</li>
    </ol>
    
    <h2>Text Alignment</h2>
    <p style="text-align: left;">Left aligned text</p>
    <p style="text-align: center;">Center aligned text</p>
    <p style="text-align: right;">Right aligned text</p>
  `);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Rich Text Editor Demo</h1>
        <p className="text-gray-600">
          This page demonstrates the rich text editor functionality with support for formatting, 
          bullet points, and mathematical/chemical equations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Editor</h2>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Start typing with rich formatting..."
            className="w-full"
          />
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="border border-gray-300 rounded-md p-4 min-h-[400px] bg-white">
            <RichTextRenderer content={content} />
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Examples</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Mathematical Examples</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Quadratic formula: {'$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$'}</li>
              <li>• Derivative: {'$\\frac{d}{dx}x^n = nx^{n-1}$'}</li>
              <li>• Integral: {'$\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$'}</li>
              <li>• Sum: {'$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$'}</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Chemical Examples</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Water formation: {'$2H_2 + O_2 \\rightarrow 2H_2O$'}</li>
              <li>• Acid dissociation: {'$HA \\rightleftharpoons H^+ + A^-$'}</li>
              <li>• pH calculation: {'$pH = -\\log[H^+]$'}</li>
              <li>• Gas law: {'$PV = nRT$'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the toolbar buttons to format text (bold, italic, underline, highlight)</li>
          <li>• Create headings using H1, H2, H3 buttons</li>
          <li>• Add bullet points and numbered lists</li>
          <li>• Align text left, center, or right</li>
          <li>• Click the ∑ button to add mathematical equations</li>
          <li>• Use LaTeX syntax for math: $inline$ or $$block$$</li>
          <li>• Examples: $E = mc^2$ or $$\\int f(x) dx$$</li>
        </ul>
      </div>
    </div>
  );
} 