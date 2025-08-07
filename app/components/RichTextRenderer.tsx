'use client';

import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = '' }) => {
  // Function to render LaTeX equations
  const renderLatex = (text: string) => {
    // Split by LaTeX delimiters
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // Block math
        const formula = part.slice(2, -2);
        try {
          return (
            <div key={index} className="my-4 flex justify-center">
              <BlockMath math={formula} />
            </div>
          );
        } catch (error) {
          console.error('LaTeX rendering error:', error);
          return (
            <div key={index} className="my-4 p-2 bg-red-50 border border-red-200 rounded text-red-600">
              Invalid LaTeX: {formula}
            </div>
          );
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        // Inline math
        const formula = part.slice(1, -1);
        try {
          return <InlineMath key={index} math={formula} />;
        } catch (error) {
          console.error('LaTeX rendering error:', error);
          return (
            <span key={index} className="text-red-600">
              Invalid LaTeX: {formula}
            </span>
          );
        }
      } else {
        // Regular text
        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      }
    });
  };

  return (
    <div className={`rich-text-renderer ${className}`}>
      {renderLatex(content)}
    </div>
  );
};

export default RichTextRenderer; 