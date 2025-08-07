# Firebase Setup Guide - Step by Step

## 🎯 Quick Setup Checklist

### ✅ Step 1: Get Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **`prepexam-59b8f`**
3. Click ⚙️ **Project Settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file

### ✅ Step 2: Extract Values from JSON
Open the downloaded JSON file and copy these values:

```json
{
  "private_key_id": "COPY_THIS_VALUE",
  "private_key": "COPY_THIS_VALUE",
  "client_email": "COPY_THIS_VALUE", 
  "client_id": "COPY_THIS_VALUE",
  "client_x509_cert_url": "COPY_THIS_VALUE"
}
```

### ✅ Step 3: Update .env File
Replace the placeholder values in your `.env` file:

```env
# Replace these with actual values from JSON file:
FIREBASE_PRIVATE_KEY_ID=your_actual_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_actual_service_account_email
FIREBASE_CLIENT_ID=your_actual_client_id
FIREBASE_CLIENT_CERT_URL=your_actual_cert_url

# Generate a secure JWT secret:
JWT_SECRET=your-secure-random-string
```

### ✅ Step 4: Enable Email Authentication
1. Go to **Authentication** > **Sign-in method**
2. Enable **Email link (passwordless sign-in)**
3. Add **localhost** to authorized domains

### ✅ Step 5: Test the Setup
1. Start your servers
2. Visit http://localhost:3003
3. Click "Get Started" to test registration

## 🔧 Troubleshooting

### Common Issues:

**❌ "Firebase configuration error"**
- Check if all environment variables are set correctly
- Verify the JSON file was downloaded properly

**❌ "Email link not working"**
- Make sure localhost is added to authorized domains
- Check if email link authentication is enabled

**❌ "Token verification failed"**
- Verify service account key is correct
- Check if project ID matches

## 📞 Need Help?

1. Check Firebase Console logs
2. Verify all environment variables
3. Test with Firebase CLI tools
4. Review the detailed setup guide in `FIREBASE_AUTH_SETUP.md` 