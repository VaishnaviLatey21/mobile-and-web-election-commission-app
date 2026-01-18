const express = require("express");
const SupportQuery = require("../models/SupportQuery");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Middleware to verify Admin
const verifyAdmin = async (req, res, next) => {
  const user = await User.findById(req.user.userId);
  if (user && user.role === "ADMIN") next();
  else res.status(403).json({ message: "Access denied." });
};

// 1. VOTER: Send a Support Query
router.post("/", auth, async (req, res) => {
  try {
    const { name, contactNumber, message } = req.body;

    // Save the query
    const newQuery = new SupportQuery({
      userId: req.user.userId,
      name,
      contactNumber,
      message
    });
    await newQuery.save();

    // NOTIFY ADMIN: Find the Admin and push a notification
    await User.updateMany(
      { role: "ADMIN" },
      {
        $push: {
          notifications: {
            message: `New Support Query from ${name}: "${message.substring(0, 30)}..."`,
            date: new Date()
          }
        }
      }
    );

    res.status(201).json({ message: "Query sent successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. ADMIN: Get All Queries
router.get("/", auth, verifyAdmin, async (req, res) => {
  try {
    const queries = await SupportQuery.find().sort({ createdAt: -1 });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. ADMIN: Mark as Resolved (Optional)
router.patch("/:id/resolve", auth, verifyAdmin, async (req, res) => {
  try {
    await SupportQuery.findByIdAndUpdate(req.params.id, { status: "Resolved" });
    res.json({ message: "Query marked as resolved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;