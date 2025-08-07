'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    studentId: '',
    institution: ''
  });

  // Get email from URL params
  useEffect(() => {
    const email = searchParams.get('email');
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { firstName, lastName, email, password, studentId, institution } = formData;
      
      if (!firstName || !lastName || !email || !password) {
        throw new Error('First name, last name, email, and password are required');
      }

      let idToken: string;
      let firebaseUid: string;

      // Check if user already exists in Firebase (from email link verification)
      const isFirebaseUser = searchParams.get('firebaseUser') === 'true';
      
      if (isFirebaseUser) {
        // User already exists in Firebase (from email verification on different device)
        // We need to sign in with their password to get the token
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          idToken = await userCredential.user.getIdToken();
          firebaseUid = userCredential.user.uid;
        } catch (firebaseError: any) {
          if (firebaseError.code === 'auth/wrong-password') {
            throw new Error('Incorrect password. Please enter the password you used during registration.');
          } else if (firebaseError.code === 'auth/user-not-found') {
            throw new Error('User not found. Please check your email or try registering again.');
          } else {
            throw firebaseError;
          }
        }
      } else {
        // Try to sign in with existing user, or create new one
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          idToken = await userCredential.user.getIdToken();
          firebaseUid = userCredential.user.uid;
        } catch (firebaseError: any) {
          if (firebaseError.code === 'auth/user-not-found') {
            // User doesn't exist, create new user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            idToken = await userCredential.user.getIdToken();
            firebaseUid = userCredential.user.uid;
          } else {
            throw firebaseError;
          }
        }
      }
      
      // Register with backend
      const response = await axios.post('/api/firebase-auth/register', {
        firstName,
        lastName,
        email,
        firebaseUid,
        studentId,
        institution,
        idToken
      });
      
      toast.success('Registration successful!');
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Registration failed';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold text-gray-900">
            {searchParams.get('firebaseUser') === 'true' ? 'Complete Your Profile' : 'Complete Your Registration'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {searchParams.get('firebaseUser') === 'true' 
              ? 'Your email has been verified. Please provide additional details to complete your profile.'
              : 'Please provide your details to complete your account setup'
            }
          </p>
          {searchParams.get('firebaseUser') === 'true' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You've verified your email on a different device. 
                Please enter the password you used during registration to complete your account setup.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Registration Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 input"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 input"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 input"
                placeholder="john@example.com"
                disabled={!!searchParams.get('email')}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-gray-500">(for account security)</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 input"
                placeholder="••••••••"
                minLength={6}
              />
              <p className="mt-1 text-sm text-gray-500">
                {searchParams.get('firebaseUser') === 'true' 
                  ? 'Enter the password you used during registration to complete your account setup.'
                  : 'Required for account security. If you already have an account, use your existing password.'
                }
              </p>
            </div>

            {/* Student ID Field */}
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Student ID (Optional)
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                value={formData.studentId}
                onChange={handleInputChange}
                className="mt-1 input"
                placeholder="STU123456"
              />
            </div>

            {/* Institution Field */}
            <div>
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                Institution (Optional)
              </label>
              <input
                id="institution"
                name="institution"
                type="text"
                value={formData.institution}
                onChange={handleInputChange}
                className="mt-1 input"
                placeholder="University Name"
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  searchParams.get('firebaseUser') === 'true' ? 'Complete Registration' : 'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => router.push('/')}
                className="w-full btn-secondary"
              >
                Back to Login
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
} 