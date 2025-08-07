'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '../lib/firebase';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Check if this is a sign-in with email link
        if (!isSignInWithEmailLink(auth, window.location.href)) {
          setError('Invalid verification link');
          setIsProcessing(false);
          return;
        }

        // Get the email from localStorage (fallback for same device)
        let email = window.localStorage.getItem('emailForSignIn');
        
        // If email not in localStorage, try to extract from URL parameters
        if (!email) {
          const urlParams = new URLSearchParams(window.location.search);
          email = urlParams.get('email');
        }
        
        // If still no email, try to extract from the email link itself
        if (!email) {
          try {
            // Firebase email links contain the email in the URL
            const url = new URL(window.location.href);
            const continueUrl = url.searchParams.get('continueUrl');
            if (continueUrl) {
              const continueUrlParams = new URLSearchParams(continueUrl);
              email = continueUrlParams.get('email');
            }
          } catch (e) {
            console.log('Could not extract email from URL');
          }
        }
        
        if (!email) {
          setError('Email not found. Please try the verification process again or restart the registration.');
          setIsProcessing(false);
          return;
        }

        // Sign in with the email link
        const result = await signInWithEmailLink(auth, email, window.location.href);
        
        if (result.user) {
          // Get the ID token
          const idToken = await result.user.getIdToken();
          
          // Check if user exists in our database
          try {
            const response = await axios.post('/api/firebase-auth/verify-token', {
              idToken: idToken
            });
            
            // User exists, complete the login process
            const loginResponse = await axios.post('/api/firebase-auth/login', {
              idToken: idToken
            });
            
            // Store user data and token in localStorage
            localStorage.setItem('token', loginResponse.data.token);
            localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
            
            // Clear the email from localStorage
            window.localStorage.removeItem('emailForSignIn');
            
            toast.success('Login successful!');
            
            // Redirect based on user role
            if (loginResponse.data.user.role === 'admin' || loginResponse.data.user.role === 'super_admin') {
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
                      } catch (error: any) {
              if (error.response?.status === 404 && error.response?.data?.needsRegistration) {
                // User doesn't exist in our database but exists in Firebase
                // Check if we have pending registration data
                const pendingRegistration = localStorage.getItem('pendingRegistration');
                
                if (pendingRegistration) {
                  try {
                    // Complete the registration
                    const registrationData = JSON.parse(pendingRegistration);
                    const registerResponse = await axios.post('/api/firebase-auth/register', {
                      ...registrationData,
                      idToken: idToken
                    });
                    
                    // Store user data and token in localStorage
                    localStorage.setItem('token', registerResponse.data.token);
                    localStorage.setItem('user', JSON.stringify(registerResponse.data.user));
                    
                    // Clear pending registration data
                    localStorage.removeItem('pendingRegistration');
                    localStorage.removeItem('emailForSignIn');
                    
                    toast.success('Registration completed successfully!');
                    
                    // Redirect to dashboard
                    router.push('/dashboard');
                  } catch (registerError: any) {
                    console.error('Registration completion error:', registerError);
                    setError('Failed to complete registration. Please try again.');
                    toast.error('Registration failed. Please try again.');
                  }
                } else {
                  // No pending registration data on this device
                  // This happens when user clicks email link on different device
                  // We need to redirect to registration page with firebaseUser=true
                  // so they can complete registration with their password
                  router.push('/register?email=' + encodeURIComponent(email) + '&firebaseUser=true');
                }
              } else {
                throw error;
              }
            }
        }
        
      } catch (error: any) {
        console.error('Email verification error:', error);
        setError(error.message || 'Verification failed');
        toast.error('Verification failed. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    handleEmailVerification();
  }, [router]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verifying your email...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your email address.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verification Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/')}
                className="btn-primary"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 