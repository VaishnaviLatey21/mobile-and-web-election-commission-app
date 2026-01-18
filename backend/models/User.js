const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  dob: { type: Date, required: true },
  scc: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["VOTER", "ADMIN"], default: "VOTER" },
  
  notifications: [{
    message: String,
    date: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
  }]
});

module.exports = mongoose.model("User", userSchema);