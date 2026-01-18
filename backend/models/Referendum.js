const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const referendumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ["Created", "Open", "Closed"], 
    default: "Created" 
  },
  hasBeenOpened: { type: Boolean, default: false },
  options: [optionSchema],
  createdAt: { type: Date, default: Date.now },
  
  viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Referendum", referendumSchema);