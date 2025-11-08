const mongoose = require("mongoose");

const wardRepSchema = new mongoose.Schema({
  wardLeaderId: { type: String, required: true, unique: true },

  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },

  ward: { type: String, required: true },
  area: { type: String },
  role: { type: String, default: "wardRep" },
  yearsOfExperience: { type: Number, default: 0 },

  address: { type: String },
  profileImage: { type: String },

  citizenMeetDays: { type: String },

  verifiedIssues: [{ type: mongoose.Schema.Types.ObjectId, ref: "Issue" }],
  totalResolvedIssues: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WardRepresentative", wardRepSchema);