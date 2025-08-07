# Firebase Authentication Setup Guide

This guide explains how to set up Firebase Authentication with Email OTP verification for the ExamTech platform.

## Overview

The implementation includes:
- Email OTP verification for user registration and login
- Firebase Admin SDK integration for backend token verification
- Student-only registration through the website (admin/super admin created via Postman)
- Secure JWT token generation after Firebase authentication

## Prerequisites

1. Firebase project with Authentication enabled
2. Firebase Admin SDK service account key
3. Domain verification for email links

## Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing project `prepexam-59b8f`
3. Enable Authentication in the Firebase console

### 2. Configure Authentication
1. In Firebase Console, go to Authentication > Sign-in method
2. Enable "Email link (passwordless sign-in)"
3. Add your domain to authorized domains:
   - `localhost` (for development)
   - Your production domain

### 3. Get Service Account Key
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Use the values from this file to set environment variables

## Environment Variables

Add the following to your `.env` file:

```env
# Firebase Configuration
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@prepexam-59b8f.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40prepexam-59b8f.iam.gserviceaccount.com

# Alternative: Use service account JSON as environment variable
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"prepexam-59b8f",...}
```

## Installation

### Frontend Dependencies
```bash
npm install firebase
```

### Backend Dependencies
```bash
cd backend
npm install firebase-admin
```

## Features

### 1. Email OTP Verification
- Users receive a secure email link for authentication
- No passwords required for initial login
- Secure token-based verification

### 2. Student-Only Registration
- Website registration is restricted to students only
- Admin and super admin accounts must be created via API/Postman
- Role enforcement at both frontend and backend

### 3. Secure Authentication Flow
1. User enters email address
2. Firebase sends verification email
3. User clicks email link
4. Backend verifies Firebase token
5. JWT token generated for session management

### 4. Fallback Password Authentication
- Password-based login available as fallback
- Useful for users who prefer traditional authentication

## API Endpoints

### Firebase Authentication Routes

#### POST `/api/firebase-auth/send-otp`
- Validates email availability
- Triggers Firebase email verification

#### POST `/api/firebase-auth/register`
- Registers new user with Firebase UID
- Creates user profile in database
- Returns JWT token

#### POST `/api/firebase-auth/login`
- Authenticates user with Firebase token
- Returns JWT token for session

#### POST `/api/firebase-auth/verify-token`
- Verifies Firebase ID token
- Checks if user exists in database

## User Registration Flow

### Website Registration (Students Only)
1. User clicks "Get Started" on homepage
2. Enters email address
3. Receives verification email
4. Clicks email link
5. Completes profile information
6. Account created with student role

### Admin Registration (Via Postman)
```bash
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@example.com",
  "password": "securepassword",
  "role": "admin"
}
```

## Security Features

### 1. Token Verification
- Firebase ID tokens verified on backend
- JWT tokens for session management
- Secure token exchange

### 2. Role-Based Access
- Student role enforced for website registration
- Admin routes protected by middleware
- Granular permissions system

### 3. Email Verification
- Email ownership verified through Firebase
- Secure email links with expiration
- Protection against unauthorized access

## Troubleshooting

### Common Issues

#### 1. Firebase Configuration Error
```
Error: Firebase configuration error
```
**Solution**: Check environment variables and service account configuration

#### 2. Email Link Not Working
```
Error: Invalid sign-in link
```
**Solution**: Verify domain is added to authorized domains in Firebase console

#### 3. Token Verification Failed
```
Error: Firebase token verification failed
```
**Solution**: Check service account key and Firebase project configuration

### Debug Steps

1. Check Firebase console for authentication logs
2. Verify environment variables are set correctly
3. Test Firebase Admin SDK connection
4. Check domain authorization in Firebase console

## Production Deployment

### 1. Domain Configuration
- Add production domain to Firebase authorized domains
- Update email action URL in Firebase console
- Configure CORS settings

### 2. Environment Variables
- Set production Firebase service account credentials
- Use secure environment variable management
- Rotate service account keys regularly

### 3. Security Headers
- Enable HTTPS only
- Configure Content Security Policy
- Set secure cookie attributes

## Testing

### Manual Testing
1. Test email verification flow
2. Verify student-only registration
3. Test admin login via Postman
4. Check role-based access control

### Automated Testing
```bash
# Run authentication tests
npm test -- --grep "Firebase Auth"

# Test email verification
npm test -- --grep "Email OTP"
```

## Monitoring

### Firebase Console
- Monitor authentication events
- Check email delivery status
- Review security logs

### Application Logs
- Authentication success/failure logs
- Token verification logs
- User registration logs

## Support

For issues related to Firebase authentication:
1. Check Firebase console logs
2. Review application error logs
3. Verify configuration settings
4. Test with Firebase CLI tools

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Guide](https://firebase.google.com/docs/admin/setup)
- [Email Link Authentication](https://firebase.google.com/docs/auth/web/email-link-auth) 