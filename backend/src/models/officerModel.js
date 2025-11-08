import mongoose from "mongoose";

const officerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  wardsManaged: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ward" }],
  assignedIssues: [{ type: mongoose.Schema.Types.ObjectId, ref: "Issue" }],
  budgetApproved: { type: Number, default: 0 },
  resolvedCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Officer", officerSchema);
