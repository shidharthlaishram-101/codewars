const express = require("express");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

const app = express();
const session = require("express-session");

// Session middleware (add before routes)
app.use(session({
  secret: process.env.SESSION_SECRET || "codewars_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hour session
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  }
}));


// Initialize Firebase Admin SDK
let serviceAccount;
let db = null;
let firebaseInitialized = false;

// Function to initialize Firebase (can be called multiple times safely)
function initializeFirebase() {
  // If already initialized, return
  if (firebaseInitialized && db) {
    return db;
  }

  try {
    // Try to load from environment variable first (for Vercel)
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (envKey) {
      console.log("🔑 Loading Firebase service account from environment variable...");
      console.log("   Env var length:", envKey.length);
      console.log("   Env var first 50 chars:", envKey.substring(0, 50));
      console.log("   Env var last 50 chars:", envKey.substring(Math.max(0, envKey.length - 50)));
      
      try {
        // Try parsing as-is first
        serviceAccount = JSON.parse(envKey);
        console.log("   ✅ JSON parsed successfully");
      } catch (parseError) {
        console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", parseError.message);
        console.error("   Parse error at position:", parseError.message.match(/position (\d+)/));
        
        // Try to fix common issues
        let fixedKey = envKey;
        // Remove any actual newlines that might have been added
        fixedKey = fixedKey.replace(/(?<!")\r?\n(?![^"]*")/g, '');
        // Ensure proper formatting
        try {
          serviceAccount = JSON.parse(fixedKey);
          console.log("   ✅ JSON parsed successfully after fixing");
        } catch (secondParseError) {
          console.error("❌ Still failed after fix attempt:", secondParseError.message);
          throw new Error("Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY environment variable. Check the format - it should be a single-line JSON string.");
        }
      }
      
      // Validate required fields
      if (!serviceAccount.type || serviceAccount.type !== 'service_account') {
        throw new Error("Invalid service account: missing or incorrect 'type' field");
      }
      if (!serviceAccount.project_id) {
        throw new Error("Invalid service account: missing 'project_id' field");
      }
      if (!serviceAccount.private_key) {
        throw new Error("Invalid service account: missing 'private_key' field");
      }
      if (!serviceAccount.client_email) {
        throw new Error("Invalid service account: missing 'client_email' field");
      }
      
      console.log("   ✅ Service account validation passed");
    } else {
      // Fallback to local file (for development)
      console.log("🔑 Loading Firebase service account from local file...");
      const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
      console.log("   Looking for file at:", serviceAccountPath);
      
      // Check if file exists
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Service account file not found at: ${serviceAccountPath}`);
      }
      
      try {
        const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
        serviceAccount = JSON.parse(fileContent);
        console.log("   File found and parsed successfully");
      } catch (fileError) {
        console.error("❌ Error loading serviceAccountKey.json:", fileError.message);
        if (fileError instanceof SyntaxError) {
          console.error("   This looks like a JSON parsing error. Check if the file is valid JSON.");
        }
        throw fileError;
      }
    }
    
    if (!serviceAccount) {
      throw new Error("Service account is null or undefined");
    }
    
    console.log("✅ Firebase service account loaded successfully");
    console.log("   Project ID:", serviceAccount.project_id);
    console.log("   Client Email:", serviceAccount.client_email);
  } catch (error) {
    console.error("❌ Error loading Firebase service account:", error.message);
    console.error("Full error:", error);
    serviceAccount = null;
    return null;
  }

  // Initialize Firebase Admin and Firestore if service account is available
  if (serviceAccount) {
    try {
      // Check if Firebase is already initialized (for serverless)
      if (admin.apps.length === 0) {
        console.log("🔄 Initializing Firebase Admin SDK...");
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase Admin initialized successfully");
        firebaseInitialized = true;
      } else {
        console.log("✅ Firebase Admin already initialized (serverless reuse)");
        console.log("   Number of apps:", admin.apps.length);
        firebaseInitialized = true;
      }
      
      // Always initialize Firestore (even if Firebase was already initialized)
      console.log("🔄 Initializing Firestore database...");
      try {
        db = admin.firestore();
        console.log("✅ Firestore database initialized");
        console.log("   DB type:", typeof db);
        console.log("   DB available:", !!db);
      } catch (firestoreError) {
        console.error("❌ Error getting Firestore instance:", firestoreError.message);
        throw firestoreError;
      }
      
      // Test connection (only in development)
      if (process.env.NODE_ENV !== "production") {
        db.listCollections()
          .then(collections => {
            console.log("✅ Firestore connected! Existing collections:");
            if (collections.length === 0) console.log("   (no collections yet)");
            else collections.forEach(c => console.log(" -", c.id));
          })
          .catch(err => {
            console.error("❌ Firestore connection test failed:", err.message);
            console.error("   This might be a permissions issue. Check your Firebase security rules.");
          });
      }
      
      return db;
    } catch (error) {
      console.error("❌ Error initializing Firebase/Firestore:", error.message);
      console.error("Error name:", error.name);
      console.error("Error stack:", error.stack);
      db = null;
      firebaseInitialized = false;
      return null;
    }
  } else {
    console.error("❌ Firebase service account not available. Database will not work.");
    console.error("Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable or provide serviceAccountKey.json");
    console.error("   Current working directory:", __dirname);
    console.error("   NODE_ENV:", process.env.NODE_ENV || "development");
    console.error("   FIREBASE_SERVICE_ACCOUNT_KEY exists:", !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return null;
  }
}

// Initialize Firebase on module load
initializeFirebase();

// Express setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Pages
app.get("/", (req, res) => {
  res.render("index", { title: "Home Page", message: "Welcome to My Website!" });
});

app.get("/registration", (req, res) => {
  res.render("registration", { title: "Register - Prajyuktam Coding Competition", error: null });
});

// Helper function to ensure database is initialized
function ensureDb() {
  if (!db) {
    console.log("⚠️ Database not initialized, attempting to initialize...");
    const initializedDb = initializeFirebase();
    if (initializedDb) {
      db = initializedDb;
      console.log("✅ Database initialized successfully on demand");
    } else {
      throw new Error("Database not initialized. Please check Firebase configuration.");
    }
  }
  return db;
}

// Helper: generate unique 4-digit code
async function generateUniqueCode() {
  const dbInstance = ensureDb();
  
  const min = 1000;
  const max = 9999;
  let code;
  let exists = true;
  let tries = 0;

  while (exists) {
    if (++tries > 50) {
      // Unlikely, but fallback to timestamp-based code to avoid infinite loop
      code = Date.now().toString().slice(-6);
      break;
    }
    code = Math.floor(Math.random() * (max - min + 1)) + min;
    const snapshot = await dbInstance.collection("registrations").where("code", "==", String(code)).limit(1).get();
    exists = !snapshot.empty;
  }
  return String(code);
}

// Registration handler
app.post("/register", async (req, res) => {
  console.log("📩 Received registration data:", req.body);

  // Extract all form fields
  const {
    competition_type,
    p1_name, p1_email, p1_phone, p1_branch, p1_semester,
    p2_name, p2_email, p2_phone, p2_branch, p2_semester
  } = req.body;

  // Validate competition type
  if (!competition_type || !["solo", "duet"].includes(competition_type)) {
    return res.status(400).render("registration", {
      error: "Please select a valid competition type."
    });
  }

  // Basic validation for first participant
  if (!p1_name || !p1_email || !p1_phone || !p1_branch || !p1_semester) {
    return res.status(400).render("registration", {
      error: "All fields for the first participant are required."
    });
  }

  // Phone validation regex
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(p1_phone)) {
    return res.status(400).render("registration", { error: "Participant 1 phone must be 10 digits." });
  }

  // Build participants array
  const participants = [
    {
      name: p1_name.trim(),
      email: p1_email.trim().toLowerCase(),
      phone: p1_phone.trim(),
      branch: p1_branch,
      semester: p1_semester,
    }
  ];

  // If duet → validate second participant and add
  if (competition_type === "duet") {
    if (!p2_name || !p2_email || !p2_phone || !p2_branch || !p2_semester) {
      return res.status(400).render("registration", {
        error: "All fields for both participants are required for duet."
      });
    }

    if (!phoneRegex.test(p2_phone)) {
      return res.status(400).render("registration", { error: "Participant 2 phone must be 10 digits." });
    }

    if (p1_email === p2_email || p1_phone === p2_phone) {
      return res.status(400).render("registration", {
        error: "Participants must use different emails and phone numbers."
      });
    }

    participants.push({
      name: p2_name.trim(),
      email: p2_email.trim().toLowerCase(),
      phone: p2_phone.trim(),
      branch: p2_branch,
      semester: p2_semester,
    });
  }

  try {
    // Ensure Firebase is initialized (important for serverless environments)
    let dbInstance;
    try {
      dbInstance = ensureDb();
    } catch (dbError) {
      console.error("❌ Database initialization failed:", dbError.message);
      console.error("   Firebase initialized:", firebaseInitialized);
      console.error("   Service account available:", !!serviceAccount);
      console.error("   Admin apps count:", admin.apps.length);
      console.error("   FIREBASE_SERVICE_ACCOUNT_KEY exists:", !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      console.error("   NODE_ENV:", process.env.NODE_ENV);
      
      return res.status(500).render("registration", {
        title: "Register - Prajyuktam Coding Competition",
        error: dbError.message + " Please check server logs for details. Make sure FIREBASE_SERVICE_ACCOUNT_KEY is set in Vercel environment variables."
      });
    }
    
    // Generate a unique code (string)
    const code = await generateUniqueCode();

    // Save as one registration document
    const docRef = await dbInstance.collection("registrations").add({
      type: competition_type,
      participants,
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Registration saved (id=${docRef.id}) with code: ${code}`);

    // Redirect to success page with team code
    res.redirect(`/success?code=${code}`);
  } catch (error) {
    console.error("❌ Error saving to Firebase:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide more helpful error message
    let errorMessage = "Server error while saving registration. Please try again later.";
    if (error.message && error.message.includes("permission")) {
      errorMessage = "Permission denied. Please check Firebase security rules.";
    } else if (error.message && error.message.includes("network")) {
      errorMessage = "Network error. Please check your internet connection.";
    }
    
    res.status(500).render("registration", {
      title: "Register - Prajyuktam Coding Competition",
      error: errorMessage
    });
  }
});


// Success page
app.get("/success", (req, res) => {
  const code = req.query.code || "N/A";
  res.render("success", { title: "Registration Successful", code });
});

// small auth route (unchanged)
app.get("/auth", (req, res) => {
  res.render("auth", { error: null });
});

app.post("/auth", async (req, res) => {
  const { uniqueCode, email } = req.body;

  try {
    const dbInstance = ensureDb();
    
    if (!uniqueCode || !email) {
      return res.render("auth", { error: "Please enter both code and email." });
    }

    const code = uniqueCode.trim();
    const enteredEmail = email.trim().toLowerCase();

    // Fetch team with that code
    const snapshot = await dbInstance.collection("registrations")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.render("auth", { error: "Invalid code. Please try again." });
    }

    const teamDoc = snapshot.docs[0].data();
    const participants = teamDoc.participants || [];

    // Check if entered email matches one of the two participants
    const validParticipant = participants.find(p => p.email === enteredEmail);

    if (!validParticipant) {
      console.log(`❌ Unauthorized access attempt with email: ${enteredEmail}`);
      return res.render("auth", { error: "This email is not registered under the provided code." });
    }

    req.session.authenticated = true;
    req.session.email = enteredEmail;
  req.session.teamCode = code;


    // ✅ Authorized participant → redirect to landing
    console.log(`✅ Access granted for ${enteredEmail} (Team ${code})`);
    res.redirect(`/landing?code=${code}&email=${encodeURIComponent(enteredEmail)}`);
  } catch (error) {
    console.error("❌ Error verifying participant:", error);
    res.render("auth", { error: "Server error. Please try again later." });
  }
});


// Landing page - show team info from the code
app.get("/landing", async (req, res) => {
  try {
    const dbInstance = ensureDb();
    
    // Step 1 — check if user is authenticated via session
    if (!req.session || !req.session.authenticated) {
      return res.redirect("/auth");
    }

    const { teamCode, email } = req.session;

    // Step 2 — verify that team still exists
    const snapshot = await dbInstance.collection("registrations")
      .where("code", "==", teamCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      req.session.destroy(() => {});
      return res.render("landing", {
        title: "Invalid Code",
        code: teamCode,
        participants: [],
        notFound: true,
        error: "Invalid team code. Please re-login.",
      });
    }

    const teamDoc = snapshot.docs[0].data();
    const participants = teamDoc.participants || [];

    // Step 3 — confirm email belongs to team
    const authorized = participants.some(p => p.email === email);

    if (!authorized) {
      req.session.destroy(() => {});
      return res.render("landing", {
        title: "Access Denied",
        code: teamCode,
        participants: [],
        notFound: true,
        error: "This email is not authorized for this code.",
      });
    }

    // ✅ Authorized participant → show landing page
    res.render("landing", {
      code: teamCode,
      participants,
      notFound: false,
      authorizedEmail: email,
    });
  } catch (err) {
    console.error("❌ Error loading landing page:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    console.log("🔒 Session ended, user logged out");
    res.redirect("/auth");
  });
});


app.get("/contest", (req, res) => {
  res.render("contest", { title: "CodeWars Contest" });
});

// Admin Dashboard — Fetch all registered teams
app.get("/admin", async (req, res) => {
  try {
    const dbInstance = ensureDb();
    
    const snapshot = await dbInstance.collection("registrations")
      .orderBy("createdAt", "desc")
      .get();

    const participants = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.render("admin", { title: "Admin Dashboard", participants });
  } catch (err) {
    console.error("❌ Error fetching participants:", err);
    res.render("admin", { title: "Admin Dashboard", participants: [] });
  }
});

// Delete a team registration
app.post("/admin/delete", async (req, res) => {
  try {
    const dbInstance = ensureDb();
    
    const { id } = req.body;
    if (!id) {
      console.log("❌ No ID received for deletion");
      return res.status(400).send("Missing registration ID");
    }

    const docRef = dbInstance.collection("registrations").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`⚠️ Document with ID ${id} not found in Firestore`);
      return res.redirect("/admin");
    }

    await docRef.delete();
    console.log(`✅ Deleted team registration: ${id}`);

    // Redirect for Firestore consistency
    res.redirect("/admin");
  } catch (err) {
    console.error("❌ Error deleting registration:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Diagnostic endpoint (remove in production or protect with auth)
app.get("/health", (req, res) => {
  // Try to initialize if not already done
  if (!db) {
    console.log("⚠️ Health check: DB not initialized, attempting initialization...");
    initializeFirebase();
  }
  
  res.json({
    status: "ok",
    firebaseInitialized: firebaseInitialized,
    dbAvailable: !!db,
    serviceAccountAvailable: !!serviceAccount,
    serviceAccountProjectId: serviceAccount ? serviceAccount.project_id : null,
    nodeEnv: process.env.NODE_ENV || "development",
    firebaseServiceAccountKeyExists: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    firebaseServiceAccountKeyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length : 0,
    adminAppsCount: admin.apps.length,
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel serverless function
// Vercel expects a handler function, not the app directly
module.exports = app;

// Also export as handler for Vercel compatibility
module.exports.handler = app;

// Start server locally (only if not in Vercel environment)
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Firebase initialized: ${firebaseInitialized}`);
    console.log(`✅ Database available: ${!!db}`);
  });
}
