# Rich Text Editor Features

## Overview

The ExamTech platform now includes a comprehensive rich text editor that supports formatting, bullet points, and mathematical/chemical equations. This enhances the content creation experience for subjects, chapters, and topics.

## Features

### Text Formatting
- **Bold**: Make text bold for emphasis
- **Italic**: Add italic styling for titles or emphasis
- **Underline**: Underline important text
- **Highlight**: Highlight key information with yellow background
- **Headings**: Create H1, H2, and H3 headings for structure

### Lists
- **Bullet Lists**: Create unordered lists with bullet points
- **Numbered Lists**: Create ordered lists with numbers
- **Nested Lists**: Support for nested list items

### Text Alignment
- **Left Align**: Default text alignment
- **Center Align**: Center text for titles or emphasis
- **Right Align**: Right-align text when needed

### Mathematical Equations
- **Inline Math**: Use `$equation$` for inline mathematical expressions
- **Block Math**: Use `$$equation$$` for centered block equations
- **LaTeX Support**: Full LaTeX syntax support for complex equations
- **Chemical Equations**: Support for chemical formulas and reactions

### Examples

#### Mathematical Equations
```
Inline: $E = mc^2$
Block: $$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$
```

#### Chemical Equations
```
Water formation: $2H_2 + O_2 \rightarrow 2H_2O$
Equilibrium: $K_c = \frac{[C]^c[D]^d}{[A]^a[B]^b}$
```

#### Common Mathematical Symbols
- Fractions: `\frac{a}{b}`
- Square root: `\sqrt{x}`
- Summation: `\sum_{i=1}^{n}`
- Integration: `\int f(x) dx`
- Greek letters: `\alpha`, `\beta`, `\gamma`, `\pi`
- Subscripts: `x_1`, `x_2`
- Superscripts: `x^2`, `x^n`

## Implementation

### Components

1. **RichTextEditor**: The main editor component with toolbar
2. **RichTextRenderer**: Component for displaying formatted content
3. **Math Support**: KaTeX integration for mathematical rendering

### Usage

#### In Forms
```tsx
import RichTextEditor from '../../components/RichTextEditor';

<RichTextEditor
  value={description}
  onChange={(value) => setDescription(value)}
  placeholder="Enter description with formatting..."
  className="w-full"
/>
```

#### For Display
```tsx
import RichTextRenderer from '../../components/RichTextRenderer';

<RichTextRenderer content={description} />
```

### Integration Points

1. **Subjects**: Description field now uses rich text editor
2. **Chapters**: Description and syllabus fields use rich text editor
3. **Topics**: Description and content fields use rich text editor

### Technical Details

- **Editor**: TipTap-based rich text editor
- **Math Rendering**: KaTeX for mathematical equations
- **Styling**: Tailwind CSS for consistent design
- **Storage**: HTML format for rich content storage

## Benefits

1. **Enhanced Content**: Better formatting and structure for educational content
2. **Mathematical Support**: Proper rendering of equations and formulas
3. **Chemical Equations**: Support for chemistry-related content
4. **User-Friendly**: Intuitive toolbar interface
5. **Consistent Display**: Proper rendering across the platform

## Demo Page

Visit `/admin/rich-text-demo` to see the rich text editor in action with examples and instructions.

## Future Enhancements

- Image upload and embedding
- Table creation and editing
- Code block syntax highlighting
- More chemical notation symbols
- Export to PDF functionality 