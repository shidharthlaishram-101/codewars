// firebaseServer.js
const admin = require("firebase-admin");
const path = require("path");

// Load service account key (download from Firebase Console → Service Accounts)
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { db };
