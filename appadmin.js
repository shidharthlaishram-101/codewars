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

// ✅ Run Admin Server
const PORT = process.env.ADMIN_PORT || 8081;
app.listen(PORT, () => console.log(`🚀 Admin server running at http://localhost:${PORT}/admin`));
