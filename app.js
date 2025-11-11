const express = require("express");
const path = require("path");
const admin = require("firebase-admin");

const app = express();
const session = require("express-session");

// Session middleware (add before routes)
// Use an environment variable for the session secret in production.
// Falls back to a local default only for development.
// If running behind a proxy (Vercel), trust the first proxy so secure cookies work
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(session({
  secret: process.env.SESSION_SECRET || "dev_local_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hour session
    httpOnly: true,
    // In production (Vercel) the app is behind a proxy and served over HTTPS.
    // Set secure and SameSite to allow cookies to be sent from the browser.
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  }
}));


// Initialize Firebase Admin SDK
// Prefer loading the service account JSON from an environment variable
// (FIREBASE_SERVICE_ACCOUNT_KEY) so you don't need to commit the key file.
// If the env var is not present, fall back to the local `serviceAccountKey.json`.
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", err);
    process.exit(1);
  }
} else {
  serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Confirm Firestore connection
db.listCollections()
  .then(collections => {
    console.log("✅ Firestore connected! Existing collections:");
    if (collections.length === 0) console.log("   (no collections yet)");
    else collections.forEach(c => console.log(" -", c.id));
  })
  .catch(err => console.error("❌ Firestore connection failed:", err.message));

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

// Helper: generate unique 4-digit code
async function generateUniqueCode() {
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
    const snapshot = await db.collection("registrations").where("code", "==", String(code)).limit(1).get();
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
    // Generate a unique code (string)
    const code = await generateUniqueCode();

    // Save as one registration document
    const docRef = await db.collection("registrations").add({
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
    res.status(500).render("registration", {
      error: "Server error while saving registration. Please try again later."
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
    if (!uniqueCode || !email) {
      return res.render("auth", { error: "Please enter both code and email." });
    }

    const code = uniqueCode.trim();
    const enteredEmail = email.trim().toLowerCase();

    // Fetch team with that code
    const snapshot = await db.collection("registrations")
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
    // Step 1 — check if user is authenticated via session
    if (!req.session || !req.session.authenticated) {
      return res.redirect("/auth");
    }

    const { teamCode, email } = req.session;

    // Step 2 — verify that team still exists
    const snapshot = await db.collection("registrations")
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


// Fetch problems by difficulty level from Firebase
app.get("/api/problems", async (req, res) => {
  try {
    if (!req.session || !req.session.authenticated) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { difficulty } = req.query;

    if (!difficulty || !["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({ error: "Invalid difficulty level. Must be easy, medium, or hard." });
    }

    // Fetch problems from Firestore and filter/sort in memory to avoid composite index requirement
    const snapshot = await db.collection("problems")
      .where("difficulty", "==", difficulty)
      .get();

    if (snapshot.empty) {
      console.log(`⚠️ No problems found for difficulty: ${difficulty}`);
      return res.json({ problems: [] });
    }

    const problems = [];
    snapshot.forEach(doc => {
      problems.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by order field
    problems.sort((a, b) => (a.order || 999) - (b.order || 999));

    console.log(`✅ Fetched ${problems.length} problems for difficulty: ${difficulty}`);
    res.json({ problems });
  } catch (error) {
    console.error("❌ Error fetching problems:", error);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

app.get("/contest", (req, res) => {
  // Check if user is authenticated
  if (!req.session || !req.session.authenticated) {
    return res.redirect("/auth");
  }

  const { teamCode, email } = req.session;
  
  // Verify session has required data
  if (!teamCode || !email) {
    console.log("⚠️ Missing session data, redirecting to auth");
    return res.redirect("/auth");
  }

  // Get difficulty level from query params (default to easy)
  const difficulty = req.query.difficulty || "easy";
  
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    return res.status(400).render("error", { message: "Invalid difficulty level" });
  }

  // Store contest start time if not already stored
  if (!req.session.contestStartTime) {
    req.session.contestStartTime = Date.now();
    console.log(`⏱️ Contest started for ${email} (Team: ${teamCode}) at ${new Date(req.session.contestStartTime).toISOString()}`);
  }

  // Store difficulty in session
  req.session.contestDifficulty = difficulty;

  res.render("contest", { 
    title: "CodeWars Contest",
    difficulty: difficulty
  });
});

// End contest session handler
app.post("/end-contest-session", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.authenticated) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { teamCode, email } = req.session;
    
    // Verify session has required data
    if (!teamCode || !email) {
      return res.status(400).json({ success: false, error: "Missing session data" });
    }

    // Calculate time completed
    const contestStartTime = req.session.contestStartTime || Date.now();
    const contestEndTime = Date.now();
    const timeElapsedMs = contestEndTime - contestStartTime;
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
    const timeElapsedMinutes = timeElapsedMs / (1000 * 60);
    
    // Format completion time
    let completionTimeFormatted;
    if (timeElapsedHours >= 1) {
      const hours = Math.floor(timeElapsedHours);
      const minutes = Math.floor((timeElapsedMinutes % 60));
      completionTimeFormatted = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      completionTimeFormatted = `${Math.floor(timeElapsedMinutes)}m`;
    }

    // Store completion time in Firestore
    // The completionTime field stores "3 hours" as the contest duration
    // timeElapsed stores the actual time taken by the user
    await db.collection("contest_completions").add({
      teamCode: teamCode,
      email: email,
      // completionTime: "3 hours", // Contest duration (3 hours)
      timeTaken: completionTimeFormatted, // Actual time taken (e.g., "2h 30m")
      // timeElapsedSeconds: Math.floor(timeElapsedMs / 1000), // Time in seconds for calculations
      // completedAt: admin.firestore.FieldValue.serverTimestamp(),
      contestStartTime: admin.firestore.Timestamp.fromMillis(contestStartTime),
      contestEndTime: admin.firestore.Timestamp.fromMillis(contestEndTime)
    });

    // Mark contest as ended in session (but keep session for feedback)
    req.session.contestEnded = true;
    
    console.log(`✅ Contest session ended for ${email} (Team: ${teamCode}) - Completed in: ${completionTimeFormatted}`);
    res.json({ 
      success: true, 
      message: "Contest session ended",
      completionTime: completionTimeFormatted
    });
  } catch (error) {
    console.error("❌ Error ending contest session:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to save contest completion data" 
    });
  }
});

// Feedback page
app.get("/feedback", (req, res) => {
  // Check if user is authenticated
  if (!req.session || !req.session.authenticated) {
    return res.redirect("/auth");
  }

  const { teamCode, email } = req.session;
  
  // Verify session has required data
  if (!teamCode || !email) {
    console.log("⚠️ Missing session data, redirecting to auth");
    return res.redirect("/auth");
  }

  res.render("feedback", { title: "Share Your Feedback" });
});

// Feedback submission handler
app.post("/feedback", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.authenticated) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { teamCode, email } = req.session;
    
    // Verify session has required data
    if (!teamCode || !email) {
      console.log("⚠️ Missing session data for feedback submission");
      return res.status(401).json({ success: false, error: "Session expired. Please login again." });
    }

    const { rating, comments } = req.body;

    // Save feedback to Firestore with email and teamCode
    await db.collection("feedback").add({
      rating: parseInt(rating) || 0,
      comments: comments || "",
      email: email,
      teamCode: teamCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Feedback submitted by ${email} (Team: ${teamCode})`);
    res.json({ success: true, message: "Thank you for your feedback!" });
  } catch (error) {
    console.error("❌ Error saving feedback:", error);
    res.status(500).json({ success: false, error: "Failed to save feedback" });
  }
});

// Judge0 API Configuration
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || "https://api.shidharthlaishram101.online";
// Optional: Add authentication headers if your Judge0 API requires them
// const JUDGE0_AUTH_HEADER = process.env.JUDGE0_AUTH_HEADER; // e.g., "Bearer your-token" or "X-RapidAPI-Key: your-key"
// const JUDGE0_AUTH_HEADER_NAME = process.env.JUDGE0_AUTH_HEADER_NAME || "Authorization";

// Startup warnings to help with deployment troubleshooting
if (isProduction && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment. In production you should provide the service account JSON via this env var (stringified). Falling back to local file may fail on Vercel.");
}
if (!process.env.JUDGE0_AUTH_HEADER) {
  console.warn("⚠️ JUDGE0_AUTH_HEADER is not set. If your Judge0 API requires authentication this will cause 'Authentication Required' errors in production. Set JUDGE0_AUTH_HEADER and optionally JUDGE0_AUTH_HEADER_NAME in your environment.");
}

// Language ID mapping for Judge0 API
// Python 3 = 92, Java = 62, C = 50
const LANGUAGE_IDS = {
  python: 71,
  java: 62,
  c: 50
};

// Language name mapping (for display)
const LANGUAGE_NAMES = {
  python: "Python 3",
  java: "Java",
  c: "C (GCC)"
};

// Helper function to build Judge0 API headers
function getJudge0Headers() {
  const headers = {
    "Content-Type": "application/json",
  };
  
  // Add authentication header if configured
  if (process.env.JUDGE0_AUTH_HEADER) {
    const headerName = process.env.JUDGE0_AUTH_HEADER_NAME || "Authorization";
    headers[headerName] = process.env.JUDGE0_AUTH_HEADER;
  }
  
  return headers;
}

// Code execution endpoint
app.post("/api/execute", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.authenticated) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { code, language, stdin } = req.body;

    // Validate input
    if (!code || !language) {
      return res.status(400).json({ error: "Code and language are required" });
    }

    // Validate language
    if (!LANGUAGE_IDS[language]) {
      return res.status(400).json({ 
        error: `Unsupported language: ${language}. Supported languages: ${Object.keys(LANGUAGE_IDS).join(", ")}` 
      });
    }

    const languageId = LANGUAGE_IDS[language];
    const languageName = LANGUAGE_NAMES[language];

    console.log(`🚀 Executing ${languageName} code for user: ${req.session.email}`);

    // Step 1: Create submission
    const submitResponse = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false`, {
      method: "POST",
      headers: getJudge0Headers(),
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: stdin || "",
        cpu_time_limit: 2, // 2 seconds CPU time limit
        memory_limit: 128000, // 128MB memory limit
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error(`❌ Judge0 submission failed: ${submitResponse.status} - ${errorText}`);
      // Provide a helpful error when authentication is missing/invalid
      if (submitResponse.status === 401 || submitResponse.status === 403) {
        return res.status(502).json({ 
          error: `Judge0 authentication failed (${submitResponse.status}). Please set JUDGE0_AUTH_HEADER (and JUDGE0_AUTH_HEADER_NAME if needed) in your deployment environment.`
        });
      }
      return res.status(500).json({ 
        error: `Judge0 API error: ${submitResponse.status}. Please try again.` 
      });
    }

    const submissionData = await submitResponse.json();
    const token = submissionData.token;

    if (!token) {
      console.error("❌ No token received from Judge0");
      return res.status(500).json({ error: "Failed to get submission token from Judge0" });
    }

    console.log(`📝 Submission created with token: ${token}`);

    // Step 2: Poll for result (with timeout)
    const maxAttempts = 30; // Maximum polling attempts
    const pollInterval = 1000; // 1 second between polls
    let attempts = 0;
    let result = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      const statusResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`, {
        method: "GET",
        headers: getJudge0Headers(),
      });

      if (!statusResponse.ok) {
        console.error(`❌ Judge0 status check failed: ${statusResponse.status}`);
        break;
      }

      result = await statusResponse.json();
      attempts++;

      // Status IDs: 1 = In Queue, 2 = Processing, 3 = Accepted, 4+ = Error/Other
      // If status.id > 2, the submission has completed (successfully or with error)
      if (result.status && result.status.id > 2) {
        console.log(`✅ Submission ${token} completed with status: ${result.status.description}`);
        break;
      }

      // Still processing
      console.log(`⏳ Submission ${token} status: ${result.status?.description || "Processing"} (attempt ${attempts}/${maxAttempts})`);
    }

    // If we exhausted attempts and result is still processing
    if (result && result.status && result.status.id <= 2) {
      console.warn(`⚠️ Submission ${token} timed out after ${maxAttempts} attempts`);
      return res.status(504).json({ 
        error: "Code execution timed out. Please try again with simpler code." 
      });
    }

    if (!result) {
      return res.status(500).json({ error: "Failed to get execution result from Judge0" });
    }

    // Format response
    const response = {
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      compile_output: result.compile_output || "",
      message: result.message || "",
      status: {
        id: result.status?.id || 0,
        description: result.status?.description || "Unknown"
      },
      time: result.time ? parseFloat(result.time).toFixed(2) : null,
      memory: result.memory || null
    };

    console.log(`✅ Code execution completed for user: ${req.session.email}`);
    res.json(response);

  } catch (error) {
    console.error("❌ Error executing code:", error);
    res.status(500).json({ 
      error: `Internal server error: ${error.message}` 
    });
  }
});

// Submission save endpoint (saves code + output to Firestore)
app.post("/api/submit", async (req, res) => {
  try {
    // Check authentication
    if (!req.session || !req.session.authenticated) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { code, language, output } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "Code and language are required" });
    }

    const { teamCode, email } = req.session;
    if (!teamCode || !email) {
      return res.status(400).json({ error: "Missing session data" });
    }

    // Save submission to Firestore
    await db.collection("submissions").add({
      teamCode: teamCode,
      email: email,
      code: code,
      language: language,
      output: output || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Submission saved for ${email} (Team: ${teamCode})`);
    res.json({ success: true, message: "Submission saved" });
  } catch (error) {
    console.error("❌ Error saving submission:", error);
    res.status(500).json({ error: "Failed to save submission" });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
