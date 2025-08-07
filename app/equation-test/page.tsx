'use client';

import React, { useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import RichTextRenderer from '../components/RichTextRenderer';
import MathEquationEditor from '../components/MathEquationEditor';

export default function EquationTestPage() {
  const [inlineEquation, setInlineEquation] = useState('x^2 + 5x + 6 = 0');
  const [blockEquation, setBlockEquation] = useState('\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}');
  const [richTextContent, setRichTextContent] = useState(`
    <p>Solve the quadratic equation: $x^2 + 5x + 6 = 0$</p>
    <p>The quadratic formula is:</p>
    <p>$$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$</p>
    <p>Where a = 1, b = 5, and c = 6.</p>
  `);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Equation Handling Test</h1>
        
        <div className="space-y-8">
          {/* Inline Equation Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Inline Equation Editor</h2>
            <MathEquationEditor
              value={inlineEquation}
              onChange={setInlineEquation}
              label="Inline Equation"
              placeholder="Enter LaTeX equation (e.g., x^2 + 5x + 6 = 0)"
            />
          </div>

          {/* Block Equation Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Block Equation Editor</h2>
            <MathEquationEditor
              value={blockEquation}
              onChange={setBlockEquation}
              label="Block Equation"
              isBlock={true}
              placeholder="Enter LaTeX equation for block display"
            />
          </div>

          {/* Rich Text Renderer Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Rich Text Renderer</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML Content with LaTeX
              </label>
              <textarea
                value={richTextContent}
                onChange={(e) => setRichTextContent(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter HTML content with LaTeX equations"
              />
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-medium mb-2">Rendered Output:</h3>
              <RichTextRenderer content={richTextContent} />
            </div>
          </div>

          {/* Manual LaTeX Examples */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">LaTeX Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Inline Examples:</h3>
                <div className="space-y-2 text-sm">
                  <p>Basic: <InlineMath math="x^2 + y^2 = z^2" /></p>
                  <p>Fraction: <InlineMath math="\frac{a}{b}" /></p>
                  <p>Square root: <InlineMath math="\sqrt{x}" /></p>
                  <p>Greek: <InlineMath math="\alpha + \beta = \pi" /></p>
                  <p>Subscript: <InlineMath math="x_1 + x_2" /></p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Block Examples:</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Quadratic Formula:</p>
                    <BlockMath math="\frac{-b \pm \sqrt{b^2-4ac}}{2a}" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Integral:</p>
                    <BlockMath math="\int_{a}^{b} f(x) dx" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Summation:</p>
                    <BlockMath math="\sum_{i=1}^{n} x_i" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common LaTeX Symbols Reference */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Common LaTeX Symbols</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <h4 className="font-medium">Fractions</h4>
                <p>\frac&#123;a&#125;&#123;b&#125;</p>
                <p>\frac&#123;1&#125;&#123;2&#125;</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Roots</h4>
                <p>\sqrt&#123;x&#125;</p>
                <p>\sqrt[3]&#123;x&#125;</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Powers & Subscripts</h4>
                <p>x^2</p>
                <p>x_1</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Greek Letters</h4>
                <p>\alpha, \beta, \pi</p>
                <p>\theta, \phi, \omega</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Calculus</h4>
                <p>\int, \sum</p>
                <p>\frac&#123;d&#125;&#123;dx&#125;</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Logic</h4>
                <p>\forall, \exists</p>
                <p>\in, \notin</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Arrows</h4>
                <p>\rightarrow, \leftarrow</p>
                <p>\Rightarrow, \Leftarrow</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Sets</h4>
                <p>\mathbb&#123;R&#125;, \mathbb&#123;Z&#125;</p>
                <p>\emptyset, \infty</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
