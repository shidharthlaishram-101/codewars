const express = require("express");
const path = require("path");

module.exports = function (db) {
  const router = express.Router();

  // Admin dashboard
  router.get("/", async (req, res) => {
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

  // Delete participant
  router.post("/delete", async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).send("Missing registration ID");

      const docRef = db.collection("registrations").doc(id);
      const docSnap = await docRef.get();
      if (!docSnap.exists) return res.redirect("/admin");

      await docRef.delete();
      console.log(`✅ Deleted team registration: ${id}`);
      setTimeout(() => res.redirect("/admin"), 800);
    } catch (err) {
      console.error("❌ Error deleting registration:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
};
