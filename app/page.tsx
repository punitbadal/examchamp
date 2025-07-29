'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  AcademicCapIcon, 
  ClockIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  UserIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import AuthModal from './components/AuthModal'

export default function HomePage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  const handleAuthSuccess = (token: string, user: any) => {
    // Store token in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Redirect based on user role
    if (user && user.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ExamTech</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/content-library" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Content Library
              </Link>
              <Link href="/practice-tests" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Practice Tests
              </Link>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="btn-secondary"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Login
              </button>
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="btn-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6"
            >
              Live Online
              <span className="text-primary-600"> Examination</span>
              <br />
              Platform
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Experience the future of competitive exams with our comprehensive online platform. 
              Support for JEE, CAT, and all major competitive examinations with real-time proctoring.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button 
                onClick={() => setIsRegisterOpen(true)}
                className="btn-primary text-lg px-8 py-3"
              >
                Start Free Trial
              </button>
              <button className="btn-secondary text-lg px-8 py-3">
                Watch Demo
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comprehensive Exam Solution
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to conduct secure, scalable online examinations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="card p-6"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Multiple Question Types
                </h3>
              </div>
              <p className="text-gray-600">
                Support for MCQ (Single/Multiple), True/False, Integer, and Numerical questions with flexible marking schemes.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-success-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Real-time Synchronization
                </h3>
              </div>
              <p className="text-gray-600">
                Live countdown timers, instant result publishing, and real-time leaderboards for competitive exams.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card p-6"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <ShieldCheckIcon className="h-6 w-6 text-warning-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Advanced Proctoring
                </h3>
              </div>
              <p className="text-gray-600">
                Browser lockdown, tab switching detection, webcam monitoring, and AI-powered suspicious activity detection.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card p-6"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-danger-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-danger-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Detailed Analytics
                </h3>
              </div>
              <p className="text-gray-600">
                Comprehensive performance analytics, section-wise analysis, and detailed reporting for administrators.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card p-6"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <UserIcon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Role-based Access
                </h3>
              </div>
              <p className="text-gray-600">
                Separate interfaces for administrators and students with granular permissions and access controls.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="card p-6"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-success-100 rounded-lg">
                  <LockClosedIcon className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Secure & Scalable
                </h3>
              </div>
              <p className="text-gray-600">
                Enterprise-grade security, high concurrency support, and cloud-native architecture for reliability.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Exam Experience?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of institutions already using ExamTech for their online examinations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setIsRegisterOpen(true)}
              className="btn bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-3"
            >
              Start Free Trial
            </button>
            <button className="btn border-white text-white hover:bg-primary-700 text-lg px-8 py-3">
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <AcademicCapIcon className="h-8 w-8 text-primary-400" />
                <span className="ml-2 text-xl font-bold">ExamTech</span>
              </div>
              <p className="text-gray-400">
                The leading online examination platform for competitive exams and assessments.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">Security</Link></li>
                <li><Link href="#" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
                <li><Link href="#" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Careers</Link></li>
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ExamTech. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Authentication Modals */}
      <AuthModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        mode="login"
        onSuccess={handleAuthSuccess}
      />
      
      <AuthModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        mode="register"
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
} 