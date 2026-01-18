const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// List of valid Shangri-La Citizen Codes (SCC) for validation.
const VALID_SCC_CODES = [
  "1AZN0FXJVM", "JOV50TOSYR", "SDUBJ5IOYB", "YFUVLYBQZR", "IGBQET800Y",
  "R2ZHBUYO2V", "Z9HOC1LF4X", "91JKHGHJK4", "N5J53QK9FO", "ZDN06T01V9",
  "4XRDN904AW", "921664ML8D", "A546AKU16A", "V0GB2G690L", "12EOU5RGVX",
  "0IXYCAH8UW", "GKJ3K1YBGE", "46HJV9KH1F", "S6K3AV3IVR", "IKKSZYJTSH"
];

// ADMIN SEEDING ROUTE
router.get("/seed-admin", async (req, res) => {
  try {
    const adminEmail = "ec@referendum.gov.sr";
    const adminPass = "Shangrilavote&2025@";

    // Check if admin already exists to prevent overwriting
    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      return res.json({ message: "Admin account already exists." });
    }

    // Securely hash the password before storage
    const hashedPassword = await bcrypt.hash(adminPass, 10);

    admin = new User({
      email: adminEmail,
      fullName: "Election Commission",
      dob: new Date("1970-01-01"), // Dummy date for admin record
      scc: "ADMIN00000",           // Reserved SCC for admin
      password: hashedPassword,
      role: "ADMIN"                // Granting Admin privileges
    });

    await admin.save();
    res.json({ message: "Admin account created successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REGISTRATION ROUTE
router.post("/register", async (req, res) => {
  console.log("Register request initiated.");

  const { email, fullName, dob, password, confirmPassword, scc } = req.body;

  // 1. Field Completeness Check
  if (!email || !fullName || !dob || !scc || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // 2. Password Consistency Check
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // 3. SCC Validity Check
  if (!VALID_SCC_CODES.includes(scc)) {
    return res.status(400).json({ 
      message: "Error: The SCC entered does not match any valid citizen record." 
    });
  }

  try {
    // 4. Duplicate Email Check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: "Error: The provided email address is already linked to an existing registered voter." 
      });
    }

    // 5. Duplicate SCC Usage Check
    const existingSCC = await User.findOne({ scc });
    if (existingSCC) {
      return res.status(400).json({ 
        message: "Error: This SCC has already been used by another user or scanned." 
      });
    }

    // 6. Secure Password Hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Create and Save User
    const newUser = new User({
      email,
      fullName,
      dob,
      scc,
      password: hashedPassword,
      // role defaults to 'VOTER' in the model schema
    });

    await newUser.save();
    console.log(`User registered: ${email} (SCC: ${scc})`);

    res.status(201).json({ message: "Registration successful", user: newUser });
  } catch (err) {
    console.error("Registration Server error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    // 1. Find User by Email
    const user = await User.findOne({ email });
    
    // ERROR HANDLING: Specific feedback for invalid username
    if (!user) {
        return res.status(400).json({ message: "Error: Invalid username or email entered." });
    }

    // 2. Validate Password
    const valid = await bcrypt.compare(password, user.password);
    
    // ERROR HANDLING: Specific feedback for invalid password
    if (!valid) {
        return res.status(400).json({ message: "Error: Invalid password entered." });
    }

    // 3. Generate JWT Token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // 4. Return Token & User Info (Sensitive data excluded)
    res.json({
      token,
      user: {
        _id: user._id, // Required for voting logic linking
        fullName: user.fullName,
        email: user.email,
        dob: user.dob,
        scc: user.scc,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// PASSWORD MANAGEMENT ROUTES
router.post("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify ownership via current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/forgot-password", async (req, res) => {
  const { email, scc, newPassword } = req.body;

  if (!email || !scc || !newPassword) {
    return res.status(400).json({ message: "All fields are required to verify identity." });
  }

  if (email.toLowerCase() === "ec@referendum.gov.sr") {
    return res.status(403).json({ 
      message: "SECURITY WARNING: Election Commission credentials cannot be reset via the public portal." 
    });
  }

  try {
    // Identity Verification Steps
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Strict check: The provided SCC must match the user's registered SCC
    if (user.scc !== scc ) {
      return res.status(401).json({ message: "Identity verification failed. SCC does not match." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Identity verified. Password updated successfully." });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// USER DATA & UTILITIES
router.post("/clear-notifications", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { $set: { notifications: [] } });
    res.json({ message: "Notifications cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;