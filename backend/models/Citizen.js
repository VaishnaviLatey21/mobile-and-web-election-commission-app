const mongoose = require("mongoose");

const citizenSchema = new mongoose.Schema({
  scc: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  dob: { type: Date, required: true }, 
  isRegistered: { type: Boolean, default: false } 
});

module.exports = mongoose.model("Citizen", citizenSchema);