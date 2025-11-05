// firebaseServer.js
const admin = require("firebase-admin");
const path = require("path");

// Load service account key (download from Firebase Console → Service Accounts)
let serviceAccount;
try {
  // Try to load from environment variable first (for Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // Fallback to local file (for development)
    serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));
  }
} catch (error) {
  console.error("❌ Error loading Firebase service account:", error.message);
  serviceAccount = null;
}

// Initialize Firebase Admin SDK
if (serviceAccount) {
  // Check if Firebase is already initialized (for serverless)
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

const db = admin.firestore();

module.exports = { db };
