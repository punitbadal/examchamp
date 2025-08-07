const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// In production, you should use environment variables for the service account
// For now, we'll use the default credentials or you can provide a service account key
let serviceAccount;

try {
  // Try to load service account from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // For development, you can use the default credentials
    // Make sure to set up Firebase Admin SDK with your service account key
    serviceAccount = {
      "type": "service_account",
      "project_id": "prepexam-59b8f",
      "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
      "private_key": process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      "client_email": process.env.FIREBASE_CLIENT_EMAIL,
      "client_id": process.env.FIREBASE_CLIENT_ID,
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
    };
  }
} catch (error) {
  console.error('Error loading Firebase service account:', error);
  serviceAccount = null;
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  if (serviceAccount && serviceAccount.private_key) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'prepexam-59b8f'
    });
  } else {
    // For development, you can use the default credentials
    // Make sure to set GOOGLE_APPLICATION_CREDENTIALS environment variable
    admin.initializeApp({
      projectId: 'prepexam-59b8f'
    });
  }
}

const auth = admin.auth();

module.exports = { admin, auth }; 