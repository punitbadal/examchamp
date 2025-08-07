'use client';

import React, { useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathEquationEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  isBlock?: boolean;
  className?: string;
}

export default function MathEquationEditor({
  value,
  onChange,
  placeholder = "Enter LaTeX equation...",
  label,
  isBlock = false,
  className = ""
}: MathEquationEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState('');

  const validateLatex = (latex: string) => {
    if (!latex.trim()) {
      setIsValid(true);
      setError('');
      return;
    }

    try {
      // Simple validation - just check if the LaTeX has basic structure
      // We'll let the actual rendering handle detailed validation
      if (latex.includes('\\') || latex.includes('{') || latex.includes('}') || latex.includes('^') || latex.includes('_')) {
        setIsValid(true);
        setError('');
      } else {
        // For simple expressions without LaTeX commands, consider them valid
        setIsValid(true);
        setError('');
      }
    } catch (err) {
      setIsValid(false);
      setError('Invalid LaTeX syntax');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    validateLatex(newValue);
  };

  const renderPreview = () => {
    if (!value.trim()) return null;

    try {
      if (isBlock) {
        return <BlockMath math={value} />;
      } else {
        return <InlineMath math={value} />;
      }
    } catch (err) {
      return (
        <div className="text-red-500 text-sm">
          Invalid LaTeX syntax
        </div>
      );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="space-y-2">
        {isBlock ? (
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isValid ? 'border-gray-300' : 'border-red-500'
            }`}
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isValid ? 'border-gray-300' : 'border-red-500'
            }`}
          />
        )}
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {/* Preview */}
        {value.trim() && (
          <div className="p-3 bg-gray-50 rounded-lg border">
            <p className="text-xs text-gray-600 mb-2">Preview:</p>
            <div className="flex items-center justify-center">
              {renderPreview()}
            </div>
          </div>
        )}
      </div>
      
      {/* LaTeX Help */}
      <div className="text-xs text-gray-500">
        <p className="font-medium mb-1">Common LaTeX symbols:</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span>Fractions: \frac&#123;a&#125;&#123;b&#125;</span>
          <span>Square root: \sqrt&#123;x&#125;</span>
          <span>Power: x^2</span>
          <span>Subscript: x_1</span>
          <span>Greek: \alpha, \beta, \pi</span>
          <span>Integral: \int</span>
          <span>Sum: \sum</span>
          <span>Infinity: \infty</span>
        </div>
      </div>
    </div>
  );
}
