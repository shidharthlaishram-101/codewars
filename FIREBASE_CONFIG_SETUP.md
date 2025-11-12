# Firebase Configuration Setup Guide

## Problem
The Firebase credentials in `views/admin.ejs` are **placeholder values** that won't work with Firebase Storage. This is why images aren't uploading or displaying.

## Solution: Get Your Real Firebase Credentials

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com/
2. Select your project: **prajyuktam-58f55**

### Step 2: Find Your Web App Configuration
1. In the left sidebar, click **Project Settings** (gear icon)
2. Go to the **Apps** section
3. Look for your Web App (should show a `</>`  icon)
4. Click the name of your web app or copy icon

### Step 3: Copy the Firebase Config
You'll see a JavaScript object like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // Your API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789...",
  appId: "1:123456789:web:abc..."
};
```

### Step 4: Update admin.ejs
Replace the placeholder config in `views/admin.ejs` (lines 14-20):

**OLD (Placeholder):**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC2VVmJ0vGJmHYhVW_PxpN5pF1Q8k2cZ3Y",
  authDomain: "prajyuktam-58f55.firebaseapp.com",
  projectId: "prajyuktam-58f55",
  storageBucket: "prajyuktam-58f55.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

**NEW (Real credentials):**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_REAL_API_KEY",
  authDomain: "YOUR_REAL_AUTH_DOMAIN",
  projectId: "YOUR_REAL_PROJECT_ID",
  storageBucket: "YOUR_REAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_REAL_MESSAGING_SENDER_ID",
  appId: "YOUR_REAL_APP_ID"
};
```

### Step 5: Verify Firebase Storage Rules
Make sure your Firebase Storage has proper read permissions:

1. Go to Firebase Console → **Storage**
2. Click **Rules** tab
3. Ensure rules allow reading (for displaying images):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow anyone to read
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 6: Test Image Upload
1. Go to Admin Panel (http://localhost:8081)
2. Try uploading an image
3. **Open browser DevTools (F12)** → **Console tab**
4. Check if you see:
   - ✅ `"✅ Image uploaded successfully: https://..."`
   - ✅ `"🔍 Contest page initialized"`
   - ✅ `"📸 Problem image URL: https://..."`

### Step 7: Test Image Display
1. Go to Contest Page
2. **Open browser DevTools (F12)** → **Console tab**
3. Should see logs like:
   - `"📸 Problem image URL: https://..."`
   - `"✅ Converted gs:// to HTTPS: https://..."`
   - or `"✅ HTTPS URL already correct: https://..."`

## Troubleshooting

### Images still not showing?
1. **Check browser console for errors** - F12 → Console tab
2. **Verify the image URL is correct** - Copy the URL from console and paste in browser address bar
3. **Check CORS headers** - Some URLs might be blocked by browser security
4. **Test Firebase Storage directly**:
   ```
   1. Go to Firebase Console → Storage
   2. Upload a test image manually
   3. Right-click file → "Copy download URL"
   4. Paste URL in browser to verify it works
   ```

### Upload fails with "No Firebase App" error?
- Your Firebase config credentials are wrong
- Copy the correct ones from Firebase Console again

### Upload succeeds but URL is `gs://...` format?
- The code is saving the storage reference instead of download URL
- Check `public/js/admin.js` → `uploadImage()` function
- Ensure it calls `getDownloadURL()` before saving

## Environment Variables (Optional but Recommended)
Instead of hardcoding credentials in admin.ejs, you can use environment variables:

Create `.env` file in root:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
...
```

Then update admin.ejs to read from `window.ENV` set by your backend.

## Still Having Issues?
1. Check that your Firebase project **Firestore Database** is also initialized
2. Verify you have **Web App** created (not just Android/iOS)
3. Ensure your Storage bucket is in the same region as your Firestore
