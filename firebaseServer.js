// firebaseServer.js
const admin = require("firebase-admin");
// Prefer a JSON string in the env var `FIREBASE_SERVICE_ACCOUNT_KEY` for hosted deployments.
// Locally you can still use a `serviceAccountKey.json` file during development when needed.

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (err) {
    console.error("Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY env variable:", err.message);
    serviceAccount = null;
  }
}

if (!serviceAccount) {
  // Fall back to local file only if present (useful for local dev). Keep this optional.
  try {
    // eslint-disable-next-line global-require
    serviceAccount = require("./serviceAccountKey.json");
  } catch (err) {
    console.warn("No service account key found locally and no FIREBASE_SERVICE_ACCOUNT_KEY env var set.");
  }
}

if (!serviceAccount) {
  throw new Error("Firebase service account is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or add serviceAccountKey.json locally.");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };
