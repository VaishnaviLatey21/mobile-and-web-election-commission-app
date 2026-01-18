const express = require("express");
const Vote = require("../models/Vote");
const Referendum = require("../models/Referendum");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// CAST VOTE
router.post("/", auth, async (req, res) => {
  const { referendumId, optionId } = req.body;

  try {
    const ref = await Referendum.findById(referendumId);
    if (!ref) return res.status(404).json({ message: "Referendum not found" });

    // SECURITY FIX: Reject if not strictly Open
    if (ref.status !== "Open") {
      return res.status(400).json({ message: "Voting is not currently open for this referendum." });
    }

    // Check if already voted
    const existing = await Vote.findOne({
      voterId: req.user.userId,
      referendumId
    });

    if (existing) {
      return res.status(400).json({ message: "You have already voted on this referendum." });
    }

    // Create Vote
    await Vote.create({
      voterId: req.user.userId,
      referendumId,
      optionId
    });

    // Update Referendum count (Atomic increment)
    await Referendum.updateOne(
      { _id: referendumId, "options._id": optionId },
      { $inc: { "options.$.votes": 1 } }
    );

    res.json({ message: "Vote submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during voting" });
  }
});

// GET MY HISTORY
router.get("/my-history", auth, async (req, res) => {
  try {
    const votes = await Vote.find({ voterId: req.user.userId }).select("referendumId optionId");
    res.json(votes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching vote history" });
  }
});

module.exports = router;