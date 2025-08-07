'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import ReactQuillEditor from './ReactQuillEditor';
import RichTextRenderer from './RichTextRenderer';

interface ImageData {
  url: string;
  key: string;
  caption: string;
  alt: string;
}

interface QuestionFormProps {
  formData: any;
  setFormData: (data: any) => void;
  errors: any;
  setErrors: (errors: any) => void;
  loading: boolean;
}

export default function QuestionForm({ formData, setFormData, errors, setErrors, loading }: QuestionFormProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingOptionImage, setUploadingOptionImage] = useState<number | null>(null);
  const [uploadingExplanationImage, setUploadingExplanationImage] = useState(false);
  const questionFileInputRef = useRef<HTMLInputElement>(null);
  const optionFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const explanationFileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev: any) => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    setFormData((prev: any) => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    setFormData((prev: any) => {
      const newOptions = prev.options.filter((_: any, i: number) => i !== index);
      return { ...prev, options: newOptions };
    });
  };

  const uploadImage = async (file: File, type: 'question' | 'option' | 'explanation', optionIndex?: number) => {
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
        const imageData: ImageData = {
          url: result.url,
          key: result.key,
          caption: '',
          alt: file.name
        };

        if (type === 'question') {
          const newImages = [...(formData.questionImages || []), imageData];
          setFormData((prev: any) => ({ ...prev, questionImages: newImages }));
        } else if (type === 'option' && optionIndex !== undefined) {
          const newImages = [...(formData.optionImages || []), { ...imageData, optionIndex }];
          setFormData((prev: any) => ({ ...prev, optionImages: newImages }));
        } else if (type === 'explanation') {
          const newImages = [...(formData.explanationImages || []), imageData];
          setFormData((prev: any) => ({ ...prev, explanationImages: newImages }));
        }
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    }
  };



  const removeImage = (type: 'question' | 'option' | 'explanation', index: number) => {
    if (type === 'question') {
      const newImages = formData.questionImages.filter((_: any, i: number) => i !== index);
      setFormData((prev: any) => ({ ...prev, questionImages: newImages }));
    } else if (type === 'option') {
      const newImages = formData.optionImages.filter((_: any, i: number) => i !== index);
      setFormData((prev: any) => ({ ...prev, optionImages: newImages }));
    } else if (type === 'explanation') {
      const newImages = formData.explanationImages.filter((_: any, i: number) => i !== index);
      setFormData((prev: any) => ({ ...prev, explanationImages: newImages }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'question' | 'option' | 'explanation', optionIndex?: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'question') {
        setUploadingImage(true);
        uploadImage(file, 'question').finally(() => setUploadingImage(false));
      } else if (type === 'option' && optionIndex !== undefined) {
        setUploadingOptionImage(optionIndex);
        uploadImage(file, 'option', optionIndex).finally(() => setUploadingOptionImage(null));
      } else if (type === 'explanation') {
        setUploadingExplanationImage(true);
        uploadImage(file, 'explanation').finally(() => setUploadingExplanationImage(false));
      }
    }
  };

  const renderImageUpload = (type: 'question' | 'option' | 'explanation', optionIndex?: number) => {
    const images = type === 'question' ? formData.questionImages : 
                  type === 'option' ? formData.optionImages?.filter((img: any) => img.optionIndex === optionIndex) : 
                  formData.explanationImages;
    const uploading = type === 'question' ? uploadingImage : 
                     type === 'option' ? uploadingOptionImage === optionIndex : 
                     uploadingExplanationImage;

    const handleClick = () => {
      if (type === 'question') {
        questionFileInputRef.current?.click();
      } else if (type === 'option' && optionIndex !== undefined) {
        optionFileInputRefs.current[optionIndex]?.click();
      } else if (type === 'explanation') {
        explanationFileInputRef.current?.click();
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            <PhotoIcon className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Add Image'}
          </button>
          {type === 'question' && (
            <input
              ref={questionFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, type, optionIndex)}
              className="hidden"
            />
          )}
          {type === 'option' && optionIndex !== undefined && (
            <input
              ref={(el) => { optionFileInputRefs.current[optionIndex] = el; }}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, type, optionIndex)}
              className="hidden"
            />
          )}
          {type === 'explanation' && (
            <input
              ref={explanationFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, type, optionIndex)}
              className="hidden"
            />
          )}
        </div>
        
        {images && images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {images.map((image: ImageData, index: number) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(type, index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Question Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Type *
        </label>
        <select
          value={formData.questionType}
          onChange={(e) => handleInputChange('questionType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="MCQ_Single">Single Choice MCQ</option>
          <option value="MCQ_Multiple">Multiple Choice MCQ</option>
          <option value="TrueFalse">True/False</option>
          <option value="Integer">Integer Type</option>
          <option value="Numerical">Numerical</option>
        </select>
        {errors.questionType && (
          <p className="mt-1 text-sm text-red-600">{errors.questionType}</p>
        )}
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Text *
        </label>
        <ReactQuillEditor
          value={formData.questionText}
          onChange={(content) => handleInputChange('questionText', content)}
          placeholder="Enter your question here..."
        />
        {errors.questionText && (
          <p className="mt-1 text-sm text-red-600">{errors.questionText}</p>
        )}
        
        {/* Question Images */}
        {renderImageUpload('question')}
      </div>

      {/* Options for MCQ */}
      {(formData.questionType === 'MCQ_Single' || formData.questionType === 'MCQ_Multiple') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options *
          </label>
          <div className="space-y-3">
            {formData.options.map((option: string, index: number) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <ReactQuillEditor
                    value={option}
                    onChange={(content) => handleOptionChange(index, content)}
                    placeholder={`Option ${index + 1}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                {renderImageUpload('option', index)}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <PlusIcon className="w-4 h-4" />
              Add Option
            </button>
          </div>
          {errors.options && (
            <p className="mt-1 text-sm text-red-600">{errors.options}</p>
          )}
        </div>
      )}

      {/* Correct Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Correct Answer *
        </label>
        {formData.questionType === 'MCQ_Single' ? (
          <select
            value={formData.correctAnswer}
            onChange={(e) => handleInputChange('correctAnswer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select correct answer</option>
            {formData.options.map((option: string, index: number) => (
              <option key={index} value={option}>
                Option {index + 1}
              </option>
            ))}
          </select>
        ) : formData.questionType === 'MCQ_Multiple' ? (
          <div className="space-y-2">
            {formData.options.map((option: string, index: number) => (
              <label key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(formData.correctAnswer) && formData.correctAnswer.includes(option)}
                  onChange={(e) => {
                    const currentAnswers = Array.isArray(formData.correctAnswer) ? formData.correctAnswer : [];
                    const newAnswers = e.target.checked
                      ? [...currentAnswers, option]
                      : currentAnswers.filter((ans: string) => ans !== option);
                    handleInputChange('correctAnswer', newAnswers);
                  }}
                  className="rounded"
                />
                <span>Option {index + 1}</span>
              </label>
            ))}
          </div>
        ) : formData.questionType === 'TrueFalse' ? (
          <select
            value={formData.correctAnswer}
            onChange={(e) => handleInputChange('correctAnswer', e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select correct answer</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        ) : (
          <input
            type="number"
            value={formData.correctAnswer}
            onChange={(e) => handleInputChange('correctAnswer', parseFloat(e.target.value))}
            placeholder="Enter correct answer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )}
        {errors.correctAnswer && (
          <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
        )}
      </div>



      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty
        </label>
        <select
          value={formData.difficulty}
          onChange={(e) => handleInputChange('difficulty', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Explanation
        </label>
        <ReactQuillEditor
          value={formData.explanation}
          onChange={(content) => handleInputChange('explanation', content)}
          placeholder="Enter explanation here..."
        />
        
        {/* Explanation Images */}
        {renderImageUpload('explanation')}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <input
          type="text"
          value={formData.tags.join(', ')}
          onChange={(e) => handleInputChange('tags', e.target.value.split(',').map((tag: string) => tag.trim()).filter(Boolean))}
          placeholder="Enter tags separated by commas"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
} 