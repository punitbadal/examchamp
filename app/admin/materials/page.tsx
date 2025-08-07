'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  PlayIcon,
  BookOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  FolderIcon,
  VideoCameraIcon,
  DocumentIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import CreateStudyMaterialForm from '../../components/CreateStudyMaterialForm';

export default function MaterialsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Study Materials</h1>
        <p className="text-gray-600">This page is working!</p>
      </div>
    </div>
  );
} 