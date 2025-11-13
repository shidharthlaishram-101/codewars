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
    const { title, difficulty, order, description, examples, constraints, hasSubQuestions, imageUrl } = req.body;

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
      imageUrl: imageUrl || "",
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
    const { title, difficulty, order, description, examples, constraints, hasSubQuestions, imageUrl } = req.body;

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
      imageUrl: imageUrl || "",
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

// ===================== CODE SNIPPET MANAGEMENT ENDPOINTS =====================

// ✅ Create a new code snippet for a problem
app.post("/api/admin/snippets", async (req, res) => {
  try {
    const { problemId, title, language, code, description } = req.body;

    // Validate required fields
    if (!problemId || !title || !language || !code) {
      return res.status(400).json({ error: "Missing required fields: problemId, title, language, code" });
    }

    // Validate language
    const validLanguages = ["python", "java", "c", "cpp", "javascript"];
    if (!validLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({ 
        error: `Invalid language. Supported: ${validLanguages.join(", ")}` 
      });
    }

    // Verify problem exists
    const problemRef = db.collection("problems").doc(problemId);
    const problemSnap = await problemRef.get();

    if (!problemSnap.exists) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // Create snippet document
    const snippetData = {
      problemId: problemId,
      title: title,
      language: language.toLowerCase(),
      code: code,
      description: description || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection("code_snippets").add(snippetData);

    console.log(`✅ Created code snippet: ${docRef.id} for problem ${problemId}`);
    res.json({ 
      success: true, 
      message: "Code snippet created successfully",
      id: docRef.id
    });
  } catch (error) {
    console.error("❌ Error creating code snippet:", error);
    res.status(500).json({ error: "Failed to create code snippet" });
  }
});

// ✅ Get all snippets for a problem
app.get("/api/admin/snippets/:problemId", async (req, res) => {
  try {
    const { problemId } = req.params;

    const snapshot = await db.collection("code_snippets")
      .where("problemId", "==", problemId)
      .get();

    const snippets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Fetched ${snippets.length} snippets for problem ${problemId}`);
    res.json({ snippets });
  } catch (error) {
    console.error("❌ Error fetching code snippets:", error);
    res.status(500).json({ error: "Failed to fetch code snippets" });
  }
});

// ✅ Update a code snippet
app.put("/api/admin/snippets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, language, code, description } = req.body;

    // Validate required fields
    if (!title || !language || !code) {
      return res.status(400).json({ error: "Missing required fields: title, language, code" });
    }

    // Validate language
    const validLanguages = ["python", "java", "c", "cpp", "javascript"];
    if (!validLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({ 
        error: `Invalid language. Supported: ${validLanguages.join(", ")}` 
      });
    }

    const snippetData = {
      title: title,
      language: language.toLowerCase(),
      code: code,
      description: description || "",
      updatedAt: new Date()
    };

    await db.collection("code_snippets").doc(id).update(snippetData);

    console.log(`✅ Updated code snippet: ${id}`);
    res.json({ 
      success: true, 
      message: "Code snippet updated successfully"
    });
  } catch (error) {
    console.error("❌ Error updating code snippet:", error);
    res.status(500).json({ error: "Failed to update code snippet" });
  }
});

// ✅ Delete a code snippet
app.delete("/api/admin/snippets/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("code_snippets").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Code snippet not found" });
    }

    await docRef.delete();

    console.log(`✅ Deleted code snippet: ${id}`);
    res.json({ 
      success: true, 
      message: "Code snippet deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting code snippet:", error);
    res.status(500).json({ error: "Failed to delete code snippet" });
  }
});

// ✅ Get all cheating records
app.get("/api/admin/cheating-records", async (req, res) => {
  try {
    const snapshot = await db.collection("cheating_records")
      .orderBy("recordedAt", "desc")
      .get();

    const cheatingRecords = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
      recordedAt: doc.data().recordedAt?.toDate?.() || doc.data().recordedAt
    }));

    console.log(`✅ Retrieved ${cheatingRecords.length} cheating records`);
    res.json({ 
      success: true, 
      cheatingRecords: cheatingRecords,
      total: cheatingRecords.length
    });
  } catch (error) {
    console.error("❌ Error fetching cheating records:", error);
    res.status(500).json({ error: "Failed to fetch cheating records" });
  }
});

// ✅ Get cheating records filtered by team code
app.get("/api/admin/cheating-records/team/:teamCode", async (req, res) => {
  try {
    const { teamCode } = req.params;
    
    const snapshot = await db.collection("cheating_records")
      .where("teamCode", "==", teamCode)
      .orderBy("recordedAt", "desc")
      .get();

    const cheatingRecords = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
      recordedAt: doc.data().recordedAt?.toDate?.() || doc.data().recordedAt
    }));

    console.log(`✅ Retrieved ${cheatingRecords.length} cheating records for team: ${teamCode}`);
    res.json({ 
      success: true, 
      cheatingRecords: cheatingRecords,
      teamCode: teamCode,
      total: cheatingRecords.length
    });
  } catch (error) {
    console.error("❌ Error fetching cheating records for team:", error);
    res.status(500).json({ error: "Failed to fetch cheating records" });
  }
});

// ✅ Get cheating records filtered by email
app.get("/api/admin/cheating-records/email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    const snapshot = await db.collection("cheating_records")
      .where("email", "==", email)
      .orderBy("recordedAt", "desc")
      .get();

    const cheatingRecords = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
      recordedAt: doc.data().recordedAt?.toDate?.() || doc.data().recordedAt
    }));

    console.log(`✅ Retrieved ${cheatingRecords.length} cheating records for email: ${email}`);
    res.json({ 
      success: true, 
      cheatingRecords: cheatingRecords,
      email: email,
      total: cheatingRecords.length
    });
  } catch (error) {
    console.error("❌ Error fetching cheating records for email:", error);
    res.status(500).json({ error: "Failed to fetch cheating records" });
  }
});

// ✅ Get cheating summary statistics
app.get("/api/admin/cheating-statistics", async (req, res) => {
  try {
    const snapshot = await db.collection("cheating_records").get();

    const records = snapshot.docs.map((doc) => doc.data());
    
    // Calculate statistics
    const stats = {
      totalIncidents: records.length,
      byType: {},
      byTeam: {},
      byEmail: {}
    };

    records.forEach((record) => {
      // Count by cheating type
      stats.byType[record.cheatingType] = (stats.byType[record.cheatingType] || 0) + 1;
      
      // Count by team
      stats.byTeam[record.teamCode] = (stats.byTeam[record.teamCode] || 0) + 1;
      
      // Count by email
      stats.byEmail[record.email] = (stats.byEmail[record.email] || 0) + 1;
    });

    // Get teams with most cheating
    const teamsWithCheating = Object.entries(stats.byTeam)
      .map(([teamCode, count]) => ({ teamCode, count }))
      .sort((a, b) => b.count - a.count);

    console.log(`✅ Generated cheating statistics`);
    res.json({ 
      success: true, 
      statistics: {
        totalIncidents: stats.totalIncidents,
        incidentsByType: stats.byType,
        incidentsByTeam: stats.byTeam,
        incidentsByEmail: stats.byEmail,
        teamsWithMostCheating: teamsWithCheating
      }
    });
  } catch (error) {
    console.error("❌ Error generating cheating statistics:", error);
    res.status(500).json({ error: "Failed to generate cheating statistics" });
  }
});

// ✅ Get submissions for admin review
app.get('/api/admin/submissions', async (req, res) => {
  try {
    const snapshot = await db.collection('submissions').orderBy('createdAt', 'desc').limit(500).get();
    const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ submissions });
  } catch (error) {
    console.error('❌ Error fetching submissions for admin:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// ✅ Evaluate a submission (accept/reject)
app.post('/api/admin/submissions/:id/evaluate', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { evaluationStatus, score, comments } = req.body;

    if (!submissionId || !evaluationStatus) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const updateData = {
      evaluated: true,
      evaluationStatus,
      evaluatedBy: 'admin',
      evaluatedAt: new Date()
    };

    if (typeof score !== 'undefined') updateData.score = score;
    if (typeof comments !== 'undefined') updateData.evaluationComments = comments;

    await db.collection('submissions').doc(submissionId).update(updateData);

    res.json({ success: true, message: 'Submission evaluated' });
  } catch (error) {
    console.error('❌ Error evaluating submission:', error);
    res.status(500).json({ error: 'Failed to evaluate submission' });
  }
});

// ✅ Run Admin Server
const PORT = process.env.ADMIN_PORT || 8081;
app.listen(PORT, () => console.log(`🚀 Admin server running at http://localhost:${PORT}/admin`));
