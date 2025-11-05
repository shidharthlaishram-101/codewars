const express = require("express");
const path = require("path");
const session = require("express-session");
const admin = require("firebase-admin");

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "codewars_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 1000, // 1 hour
      httpOnly: true,
    },
  })
);

// ✅ Firebase Admin setup
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// ✅ Import admin routes
const adminRoutes = require("../routes/admin");
app.use("/admin", adminRoutes(db));

// ✅ Your normal routes
app.get("/", (req, res) => {
  res.render("index", { title: "Home Page", message: "Welcome to My Website!" });
});

app.get("/registration", (req, res) => {
  res.render("registration", { title: "Register", error: null });
});

// You can bring all your registration/auth routes here
// (cut them from your old app.js and paste below)

// Export the serverless function
module.exports = app;
