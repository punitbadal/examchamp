'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithEmailLink, 
  isSignInWithEmailLink,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onSuccess: (token: string, user: any) => void;
}

export default function FirebaseAuthModal({ isOpen, onClose, mode, onSuccess }: FirebaseAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'email' | 'otp' | 'complete'>('email');
  const [authMethod, setAuthMethod] = useState<'password' | 'email-link'>('password');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    studentId: '',
    institution: ''
  });
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    if (isOpen && recaptchaRef.current && !recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          console.log('reCAPTCHA solved:', response);
        }
      });
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle email verification for registration
  const handleSendVerificationEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { email } = formData;
      
      if (!email) {
        throw new Error('Email is required');
      }

      // Check if user exists (for registration)
      if (mode === 'register') {
        try {
          await axios.post('/api/firebase-auth/send-otp', { email });
        } catch (error: any) {
          if (error.response?.status === 400) {
            throw new Error(error.response.data.error);
          }
        }
      }

      // Send verification email via Firebase
      const actionCodeSettings = {
        url: window.location.origin + '/auth-callback?email=' + encodeURIComponent(email),
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Save email to localStorage for verification
      window.localStorage.setItem('emailForSignIn', email);
      
      setOtpSent(true);
      setVerificationStep('otp');
      toast.success('Verification email sent! Please check your inbox.');
      
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to send verification email';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password-based login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { email, password } = formData;
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        // Send verification email if not verified
        await sendEmailVerification(userCredential.user);
        toast.error('Email not verified. Please check your email and click the verification link before logging in.');
        return;
      }
      
      // Login to backend
      try {
        const response = await axios.post('/api/firebase-auth/login', {
          idToken: idToken
        });
        
        toast.success('Login successful!');
        onSuccess(response.data.token, response.data.user);
        onClose();
      } catch (loginError: any) {
        // If user doesn't exist in database, redirect to registration
        if (loginError.response?.status === 401 && loginError.response?.data?.error?.includes('not found')) {
          toast.error('Account not found. Please complete your registration first.');
          // Redirect to registration page with user info
          const registrationUrl = `/register?email=${encodeURIComponent(email)}&firebaseUser=true`;
          window.location.href = registrationUrl;
          return;
        }
        throw loginError;
      }
      
    } catch (error: any) {
      const message = error.message || 'Login failed';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password-based registration with email verification
  const handlePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { firstName, lastName, email, password, studentId, institution } = formData;
      
      if (!firstName || !lastName || !email || !password) {
        throw new Error('All required fields must be filled');
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      // Save registration data to localStorage for later use
      const registrationData = {
        firstName,
        lastName,
        email,
        firebaseUid: userCredential.user.uid,
        studentId,
        institution
      };
      localStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
      
      toast.success('Account created! Please check your email and click the verification link to complete registration.');
      onClose();
      
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Registration failed';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setOtpSent(false);
      setVerificationStep('email');
      setAuthMethod('password');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        studentId: '',
        institution: ''
      });
    }
  }, [isOpen, mode]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'login' ? 'Login' : 'Create Account'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={
              mode === 'login' && authMethod === 'password' ? handlePasswordLogin :
              mode === 'register' && authMethod === 'password' ? handlePasswordRegister :
              handleSendVerificationEmail
            } className="p-6 space-y-4">
              
              {/* Error Alert */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-md p-4 mb-4"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {mode === 'login' ? 'Login Failed' : 'Registration Failed'}
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {errorMessage}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Registration Fields */}
              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="input"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="input"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student ID (Optional)
                    </label>
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="ST123456"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution (Optional)
                    </label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Your School/College"
                    />
                  </div>
                </>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="john@example.com"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="input pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Authentication Method Toggle */}
              {mode === 'login' && (
                <div className="flex items-center justify-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('password')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      authMethod === 'password'
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Password Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('email-link')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      authMethod === 'email-link'
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Email Link
                  </button>
                </div>
              )}

              {/* OTP Verification Step */}
              {verificationStep === 'otp' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Check Your Email
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        We've sent a verification link to <strong>{formData.email}</strong>. 
                        Click the link in your email to complete {mode === 'login' ? 'login' : 'registration'}.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* reCAPTCHA Container */}
              <div id="recaptcha-container" ref={recaptchaRef}></div>

              {/* Submit Button */}
              {verificationStep === 'email' && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                    </div>
                  ) : (
                    mode === 'login' ? 'Login' : 'Create Account'
                  )}
                </button>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <p className="text-center text-sm text-gray-600">
                {mode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        onClose();
                      }}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        onClose();
                      }}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 