'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = '' }) => {
  // Function to render math expressions
  const renderMath = (text: string) => {
    // Split by math delimiters
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // Block math
        const math = part.slice(2, -2);
        return (
          <BlockMath key={index} math={math} />
        );
      } else if (part.startsWith('$') && part.endsWith('$')) {
        // Inline math
        const math = part.slice(1, -1);
        return (
          <InlineMath key={index} math={math} />
        );
      } else {
        // Regular text
        return part;
      }
    });
  };

  // Custom components for ReactMarkdown
  const components = {
    // Override paragraph to handle math
    p: ({ children, ...props }: any) => {
      if (typeof children === 'string') {
        return <p {...props}>{renderMath(children)}</p>;
      }
      return <p {...props}>{children}</p>;
    },
    // Override headings to handle math
    h1: ({ children, ...props }: any) => {
      if (typeof children === 'string') {
        return <h1 {...props}>{renderMath(children)}</h1>;
      }
      return <h1 {...props}>{children}</h1>;
    },
    h2: ({ children, ...props }: any) => {
      if (typeof children === 'string') {
        return <h2 {...props}>{renderMath(children)}</h2>;
      }
      return <h2 {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }: any) => {
      if (typeof children === 'string') {
        return <h3 {...props}>{renderMath(children)}</h3>;
      }
      return <h3 {...props}>{children}</h3>;
    },
    // Override list items to handle math
    li: ({ children, ...props }: any) => {
      if (typeof children === 'string') {
        return <li {...props}>{renderMath(children)}</li>;
      }
      return <li {...props}>{children}</li>;
    },
    // Override strong to handle math
    strong: ({ children, ...props }: any) => {
      if (typeof children === 'string') {
        return <strong {...props}>{renderMath(children)}</strong>;
      }
      return <strong {...props}>{children}</strong>;
    },
    // Override em to handle math
    em: ({ children, ...props }: any) => {
      if (typeof children === 'string') {
        return <em {...props}>{renderMath(children)}</em>;
      }
      return <em {...props}>{children}</em>;
    },
  };

  // If content contains HTML (from TipTap), render it directly
  if (content.includes('<') && content.includes('>')) {
    return (
      <div 
        className={`prose prose-sm max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Otherwise, treat as markdown
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default RichTextRenderer; 