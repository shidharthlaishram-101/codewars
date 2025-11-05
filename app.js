const express = require("express");
const path = require("path");
const admin = require("firebase-admin");

const app = express();

module.exports = app;

const session = require("express-session");

// Session middleware (add before routes)
app.use(session({
  secret: "codewars_secret_key", // change to an env variable in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hour session
    httpOnly: true,
  }
}));


// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");
// or from env: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)

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
      title: "Welcome to CodeWars",
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

// Start server
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
