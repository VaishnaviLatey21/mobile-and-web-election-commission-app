const express = require("express");
const Referendum = require("../models/Referendum");
const Vote = require("../models/Vote");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Middleware to check Admin Role
const verifyAdmin = async (req, res, next) => {
  if (!req.user || !req.user.userId) return res.status(401).json({ message: "Unauthorized" });
  const user = await User.findById(req.user.userId);
  if (user && user.role === "ADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Election Commission only." });
  }
};

// PUBLIC ROUTES (Read-Only)
router.get("/:id", async (req, res) => {
  try {
    const ref = await Referendum.findById(req.params.id);
    
    if (!ref) {
      return res.status(404).json({ message: "Referendum not found" });
    }

    res.json(ref);
  } catch (err) {
    // Check if error is due to invalid ID format
    if (err.kind === "ObjectId") {
        return res.status(400).json({ message: "Invalid Referendum ID format" });
    }
    res.status(500).json({ message: err.message });
  }
});

// GET ALL
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    // If 'status' is provided in the URL, filter by it
    if (status) {
      // "i" makes it case-insensitive (matches "Open", "open", "OPEN")
      query.status = { $regex: new RegExp(`^${status}$`, "i") };
    }

    const data = await Referendum.find(query).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE (Admin Only)
router.post("/", auth, verifyAdmin, async (req, res) => {
  try {
    const { title, description, options } = req.body;
    const formattedOptions = options.map(text => ({ text, votes: 0 }));

    const newRef = new Referendum({
      title,
      description,
      options: formattedOptions,
      status: "Created"
    });

    await newRef.save();
    res.json(newRef);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE DETAILS (Admin Only)
router.put("/:id", auth, verifyAdmin, async (req, res) => {
  try {
    const ref = await Referendum.findById(req.params.id);
    if (!ref) return res.status(404).json({ message: "Not found" });

    if (ref.hasBeenOpened) {
      return res.status(400).json({ 
        message: "Referendum cannot be edited because it has already been opened." 
      });
    }

    const { title, description, options } = req.body;
    ref.title = title;
    ref.description = description;
    
    if (options) {
      ref.options = options.map(text => ({ text, votes: 0 }));
    }

    await ref.save();
    res.json(ref);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TOGGLE STATUS (Admin Only)
router.patch("/:id/status", auth, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const ref = await Referendum.findById(req.params.id);

    if (!ref) return res.status(404).json({ message: "Not found" });

    // SECURITY FIX: Prevent Re-opening Closed Referendums
    if (ref.status === "Closed" && status === "Open") {
      return res.status(400).json({ message: "Action Denied: A closed referendum cannot be re-opened." });
    }

    ref.status = status;
    if (status === "Open") {
      ref.hasBeenOpened = true;
    }

    await ref.save();
    res.json(ref);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// VIEW TRACKING
router.post("/:id/view", auth, async (req, res) => {
  try {
    await Referendum.findByIdAndUpdate(req.params.id, {
      $addToSet: { viewedBy: req.user.userId }
    });
    res.json({ message: "View recorded" });
  } catch (err) {
    res.status(500).json({ message: "Error recording view" });
  }
});

// ANALYTICS
router.get("/:id/analytics", auth, async (req, res) => {
  try {
    const refId = req.params.id;
    const ref = await Referendum.findById(refId);
    if (!ref) return res.status(404).json({ message: "Referendum not found" });

    // SECURITY FIX: Block Analytics for Unopened Referendums
    if (ref.status === "Created") {
      return res.status(400).json({ message: "Analytics are only available after the referendum opens." });
    }

    const totalVoters = await User.countDocuments({ role: "VOTER" });
    const votes = await Vote.find({ referendumId: refId });
    const totalVotesCast = votes.length;
    const notVotedCount = Math.max(0, totalVoters - totalVotesCast);
    
    const voterIds = new Set(votes.map(v => v.voterId.toString()));
    const viewedList = ref.viewedBy || [];
    const viewedButNotVotedCount = viewedList.filter(
      userId => !voterIds.has(userId.toString())
    ).length;

    res.json({
      totalVoters,
      totalVotesCast,
      notVotedCount,
      viewedButNotVotedCount,
      viewedTotal: viewedList.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NOTIFY PENDING VOTERS
router.post("/:id/notify", auth, async (req, res) => {
  try {
    const refId = req.params.id;
    const ref = await Referendum.findById(refId);
    
    // Only allow notifications for Open referendums
    if (ref.status !== "Open") {
      return res.status(400).json({ message: "Notifications can only be sent for Active/Open referendums." });
    }

    const votes = await Vote.find({ referendumId: refId });
    const votedUserIds = votes.map(v => v.voterId);

    const result = await User.updateMany(
      { 
        role: "VOTER", 
        _id: { $nin: votedUserIds } 
      },
      {
        $push: {
          notifications: {
            message: `Action Required: Please cast your vote for "${ref.title}".`,
            date: new Date()
          }
        }
      }
    );

    res.json({ message: `Notifications sent to ${result.modifiedCount} pending voters.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;