const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../config/firebase');
const router = express.Router();

// @route   POST /api/firebase-auth/send-otp
// @desc    Send OTP to email for verification
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // For Firebase Auth, the OTP sending is handled on the frontend
    // This endpoint just validates the email and checks if user exists
    res.status(200).json({
      message: 'Email is available for registration',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// @route   POST /api/firebase-auth/register
// @desc    Register a new user with Firebase authentication (after email verification)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      firebaseUid, 
      studentId, 
      institution,
      idToken
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !firebaseUid || !idToken) {
      return res.status(400).json({
        error: 'Missing required fields: firstName, lastName, email, firebaseUid, idToken'
      });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', firebaseError);
      return res.status(401).json({
        error: 'Invalid Firebase token'
      });
    }

    // Ensure the Firebase UID matches the token
    if (decodedToken.uid !== firebaseUid) {
      return res.status(401).json({
        error: 'Firebase UID mismatch'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { firebaseUid: firebaseUid }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email or Firebase UID already exists'
      });
    }

    // Check if studentId is unique if provided
    if (studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({
          error: 'Student ID already exists'
        });
      }
    }

    // Create new user (only students can register through website)
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      firebaseUid,
      role: 'student', // Force student role for website registration
      studentId,
      institution,
      isEmailVerified: true, // Firebase email is already verified
      isActive: true
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        firebaseUid: user.firebaseUid 
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Return user data and token
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Firebase registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
});

// @route   POST /api/firebase-auth/login
// @desc    Login user with Firebase authentication
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: 'Firebase ID token is required'
      });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', firebaseError);
      return res.status(401).json({
        error: 'Invalid Firebase token'
      });
    }

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      return res.status(401).json({
        error: 'User not found. Please register first.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        error: 'Email not verified. Please check your email and click the verification link before logging in.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        firebaseUid: user.firebaseUid 
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Return user data and token
    res.status(200).json({
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
});

// @route   POST /api/firebase-auth/verify-token
// @desc    Verify Firebase token and return user info
// @access  Public
router.post('/verify-token', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: 'Firebase ID token is required'
      });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', firebaseError);
      return res.status(401).json({
        error: 'Invalid Firebase token'
      });
    }

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        needsRegistration: true
      });
    }

    res.status(200).json({
      message: 'Token verified successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Internal server error during token verification'
    });
  }
});

// @route   POST /api/firebase-auth/check-email-verification
// @desc    Check if user's email is verified in Firebase
// @access  Public
router.post('/check-email-verification', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: 'Firebase ID token is required'
      });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', firebaseError);
      return res.status(401).json({
        error: 'Invalid Firebase token'
      });
    }

    // Check if email is verified in Firebase
    const isEmailVerified = decodedToken.email_verified;

    res.status(200).json({
      message: 'Email verification status checked',
      isEmailVerified,
      email: decodedToken.email
    });

  } catch (error) {
    console.error('Email verification check error:', error);
    res.status(500).json({
      error: 'Internal server error during email verification check'
    });
  }
});

// @route   POST /api/firebase-auth/send-password-reset
// @desc    Send password reset email using Firebase
// @access  Public
router.post('/send-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Check if user exists in our database
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        error: 'User with this email not found'
      });
    }

    // For Firebase Auth, password reset is handled on the frontend
    // This endpoint just validates that the user exists
    res.status(200).json({
      message: 'Password reset email will be sent',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Send password reset error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router; 