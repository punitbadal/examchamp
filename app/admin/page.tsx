'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  UserIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and is admin
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      window.location.href = '/';
      return;
    }

    try {
      const user = JSON.parse(userData);
      
      // Check if user is admin
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        window.location.href = '/dashboard';
        return;
      }
      
      setUser(user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ExamTech Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 p-2">
                <BellIcon className="h-5 w-5" />
              </button>
              <div className="relative">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                  <UserIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Admin Dashboard, {user.firstName}! 👨‍💼
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your examination platform, users, and analytics from here.
          </p>
        </div>

        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Exams</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DocumentTextIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">78.5%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Alerts</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ShieldCheckIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Admin Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center mb-4">
              <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Manage student accounts, view profiles, and handle user permissions.
            </p>
            <div className="space-y-2">
              <Link href="/admin/users" className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md">
                View All Users
              </Link>
              <Link href="/admin/users/create" className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md">
                Create New User
              </Link>
              <Link href="/admin/users/import" className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md">
                Bulk Import Users
              </Link>
            </div>
          </motion.div>

          {/* Question Management */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Question Management</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Create, organize, and manage questions for exams and practice tests.
            </p>
            <div className="space-y-2">
              <Link href="/admin/questions" className="block w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md">
                View All Questions
              </Link>
              <Link href="/admin/questions/create" className="block w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md">
                Create New Question
              </Link>
              <Link href="/admin/questions/import" className="block w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md">
                Import/Export Questions
              </Link>
            </div>
          </motion.div>

          {/* Exam Management */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Exam Management</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Create and manage exams, set schedules, and monitor exam sessions.
            </p>
            <div className="space-y-2">
              <Link href="/admin/exams" className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md">
                View All Exams
              </Link>
              <Link href="/admin/exams/create" className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md">
                Create New Exam
              </Link>
              <Link href="/admin/exams/schedule" className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md">
                Schedule Exams
              </Link>
            </div>
          </motion.div>

          {/* Analytics & Reports */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center mb-4">
              <ChartBarIcon className="h-8 w-8 text-purple-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
            </div>
            <p className="text-gray-600 mb-4">
              View detailed analytics, performance reports, and insights.
            </p>
            <div className="space-y-2">
              <Link href="/admin/analytics" className="block w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md">
                Performance Analytics
              </Link>
              <Link href="/admin/reports" className="block w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md">
                Generate Reports
              </Link>
              <Link href="/admin/insights" className="block w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md">
                Data Insights
              </Link>
            </div>
          </motion.div>

          {/* Security & Proctoring */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Security</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Monitor proctoring sessions and handle security alerts.
            </p>
            <div className="space-y-2">
              <Link href="/admin/proctoring" className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
                Proctoring Monitor
              </Link>
              <Link href="/admin/alerts" className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
                Security Alerts
              </Link>
              <Link href="/admin/settings" className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
                Security Settings
              </Link>
            </div>
          </motion.div>

          {/* Content Management */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center mb-4">
              <AcademicCapIcon className="h-8 w-8 text-orange-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Content</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Manage study materials, practice tests, and educational content.
            </p>
            <div className="space-y-2">
              <Link href="/admin/content" className="block w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-md">
                Content Library
              </Link>
              <Link href="/admin/practice-tests" className="block w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-md">
                Practice Tests
              </Link>
              <Link href="/admin/materials" className="block w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-md">
                Study Materials
              </Link>
            </div>
          </motion.div>

          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center mb-4">
              <CogIcon className="h-8 w-8 text-gray-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Configure system settings, notifications, and platform preferences.
            </p>
            <div className="space-y-2">
              <Link href="/admin/settings" className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                System Settings
              </Link>
              <Link href="/admin/notifications" className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                Notifications
              </Link>
              <Link href="/admin/backup" className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                Backup & Restore
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white rounded-lg shadow-sm border p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24</div>
              <div className="text-sm text-gray-600">New Users Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">156</div>
              <div className="text-sm text-gray-600">Exams Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">89%</div>
              <div className="text-sm text-gray-600">System Uptime</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 