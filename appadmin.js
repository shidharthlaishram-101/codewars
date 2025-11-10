const express = require("express");
const path = require("path");
const { db } = require("./firebaseServer"); // Firebase Admin SDK initialized

const app = express();

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Admin Dashboard — Fetch all registered teams
app.get("/admin", async (req, res) => {
  try {
    const snapshot = await db.collection("registrations")
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

// ✅ Delete a team registration
app.post("/admin/delete", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      console.log("❌ No ID received for deletion");
      return res.status(400).send("Missing registration ID");
    }

    const docRef = db.collection("registrations").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`⚠️ Document with ID ${id} not found in Firestore`);
      return res.redirect("/admin");
    }

    await docRef.delete();
    console.log(`✅ Deleted team registration: ${id}`);

    // Delay redirect slightly for Firestore consistency
    setTimeout(() => res.redirect("/admin"), 800);
  } catch (err) {
    console.error("❌ Error deleting registration:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ===================== PROBLEM MANAGEMENT ENDPOINTS =====================

// ✅ Get all problems (for admin)
app.get("/api/admin/problems", async (req, res) => {
  try {
    // Fetch all problems and sort in memory to avoid needing composite index
    const snapshot = await db.collection("problems").get();

    const problems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by difficulty then by order
    const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
    problems.sort((a, b) => {
      const diffDiff = (difficultyOrder[a.difficulty] || 999) - (difficultyOrder[b.difficulty] || 999);
      if (diffDiff !== 0) return diffDiff;
      return (a.order || 999) - (b.order || 999);
    });

    console.log(`✅ Fetched ${problems.length} problems for admin`);
    res.json({ problems });
  } catch (error) {
    console.error("❌ Error fetching problems:", error);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

// ✅ Create a new problem
app.post("/api/admin/problems", async (req, res) => {
  try {
    const { title, difficulty, order, description, examples, constraints, hasSubQuestions } = req.body;

    // Validate required fields
    if (!title || !difficulty || !order || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({ error: "Invalid difficulty level" });
    }

    // Create problem document
    const problemData = {
      title,
      difficulty,
      order: parseInt(order),
      description,
      examples: examples || [],
      constraints: constraints || [],
      hasSubQuestions: Boolean(hasSubQuestions),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection("problems").add(problemData);

    console.log(`✅ Created problem: ${docRef.id} - ${title}`);
    res.json({ 
      success: true, 
      message: "Problem created successfully",
      id: docRef.id
    });
  } catch (error) {
    console.error("❌ Error creating problem:", error);
    res.status(500).json({ error: "Failed to create problem" });
  }
});

// ✅ Update a problem
app.put("/api/admin/problems/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, difficulty, order, description, examples, constraints, hasSubQuestions } = req.body;

    // Validate required fields
    if (!title || !difficulty || !order || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({ error: "Invalid difficulty level" });
    }

    const problemData = {
      title,
      difficulty,
      order: parseInt(order),
      description,
      examples: examples || [],
      constraints: constraints || [],
      hasSubQuestions: Boolean(hasSubQuestions),
      updatedAt: new Date()
    };

    await db.collection("problems").doc(id).update(problemData);

    console.log(`✅ Updated problem: ${id} - ${title}`);
    res.json({ 
      success: true, 
      message: "Problem updated successfully"
    });
  } catch (error) {
    console.error("❌ Error updating problem:", error);
    res.status(500).json({ error: "Failed to update problem" });
  }
});

// ✅ Delete a problem
app.delete("/api/admin/problems/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("problems").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Problem not found" });
    }

    await docRef.delete();

    console.log(`✅ Deleted problem: ${id}`);
    res.json({ 
      success: true, 
      message: "Problem deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting problem:", error);
    res.status(500).json({ error: "Failed to delete problem" });
  }
});

// ✅ Run Admin Server
const PORT = process.env.ADMIN_PORT || 8081;
app.listen(PORT, () => console.log(`🚀 Admin server running at http://localhost:${PORT}/admin`));
