const express = require("express");
const path = require("path");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// Set EJS as template engine
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

// Import routes or logic from app.js
const mainApp = require("../app");
app.use("/", mainApp);

// Optional: If you have admin routes in appadmin.js
// const adminRoutes = require("../appadmin");
// app.use("/admin", adminRoutes);

module.exports = app;