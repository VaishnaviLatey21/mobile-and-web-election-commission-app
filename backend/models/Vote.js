const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  voterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  referendumId: { type: mongoose.Schema.Types.ObjectId, ref: "Referendum", required: true },
  optionId: { type: String, required: true }, 
  castedAt: { type: Date, default: Date.now }
});

voteSchema.index({ voterId: 1, referendumId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);