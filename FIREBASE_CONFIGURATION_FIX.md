# Firebase Configuration Fix Guide

## Issue
You're getting a `CONFIGURATION_NOT_FOUND` error when trying to use Firebase Email Link authentication. This happens because Email Link (Passwordless Sign-in) is not enabled in your Firebase project.

## Step-by-Step Fix

### 1. Enable Email Link Authentication in Firebase Console

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `prepexam-59b8f`

2. **Navigate to Authentication**
   - In the left sidebar, click on "Authentication"
   - Click on the "Sign-in method" tab

3. **Enable Email Link (Passwordless Sign-in)**
   - Find "Email link (passwordless sign-in)" in the list
   - Click on it to open the configuration
   - Toggle the "Enable" switch to turn it ON
   - Click "Save"

### 2. Configure Authorized Domains

1. **Go to Settings**
   - In the Authentication section, click on the "Settings" tab
   - Scroll down to "Authorized domains"

2. **Add Your Domain**
   - Add `localhost` for development
   - Add your production domain when you deploy
   - Click "Add domain" after each entry

### 3. Configure Action Code Settings (Optional but Recommended)

1. **Go to Authentication > Settings**
   - Click on "Action code settings" tab
   - Configure the following:
     - **URL to redirect to**: `http://localhost:3000/auth-callback` (for development)
     - **Handle code in app**: Enable this option
     - **iOS bundle ID**: Leave empty for web app
     - **Android package name**: Leave empty for web app
     - **Android install app**: Leave unchecked
     - **Android minimum version**: Leave empty

### 4. Test the Configuration

After making these changes:

1. **Restart your containers** (if needed):
   ```bash
   docker-compose restart
   ```

2. **Test the registration flow**:
   - Go to http://localhost:3000
   - Click "Register"
   - Enter an email address
   - Click "Send OTP"
   - You should now receive an email with a sign-in link

### 5. Alternative: Use Email/Password Authentication

If you prefer to use traditional email/password authentication instead of email links, you can:

1. **Enable Email/Password in Firebase Console**:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - You can also enable "Email link (passwordless sign-in)" for both options

2. **The current implementation supports both**:
   - Email Link (passwordless) - primary method
   - Email/Password - fallback method

## Troubleshooting

### If you still get CONFIGURATION_NOT_FOUND:

1. **Check Firebase Project ID**:
   - Ensure your project ID is correct: `prepexam-59b8f`
   - Verify in Firebase Console that this is the correct project

2. **Check API Key**:
   - Verify the API key in your environment variables
   - The API key should match the one in Firebase Console > Project Settings > General

3. **Wait for Propagation**:
   - Firebase changes can take a few minutes to propagate
   - Wait 5-10 minutes after making changes before testing

4. **Clear Browser Cache**:
   - Clear your browser cache and cookies
   - Try in an incognito/private window

### If you get other errors:

1. **Check Firebase Console Logs**:
   - Go to Firebase Console > Authentication > Users
   - Check for any error messages

2. **Check Browser Console**:
   - Open browser developer tools
   - Look for any JavaScript errors

## Production Deployment

When deploying to production:

1. **Update Authorized Domains**:
   - Add your production domain to authorized domains
   - Remove `localhost` if not needed

2. **Update Action Code Settings**:
   - Change the redirect URL to your production domain
   - Example: `https://yourdomain.com/auth-callback`

3. **Update Environment Variables**:
   - Ensure all Firebase environment variables are set correctly
   - Use production Firebase project settings

## Current Status

✅ **Backend**: Firebase Admin SDK configured and working
✅ **Frontend**: Firebase client SDK configured and working
✅ **Docker**: All containers running with Firebase environment variables
❌ **Firebase Console**: Email Link authentication needs to be enabled

## Next Steps

1. Follow the steps above to enable Email Link authentication in Firebase Console
2. Test the registration flow
3. If successful, the Firebase authentication will be fully functional

## Support

If you continue to have issues after following these steps, please:
1. Check the Firebase Console for any error messages
2. Verify all environment variables are correct
3. Check the browser console for JavaScript errors
4. Check the Docker container logs for backend errors 