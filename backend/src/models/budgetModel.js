import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    // 🔗 Linked Issue (Every issue has one related budget record)
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: [true, "Budget must be linked to an issue"],
    },

    // 🏙️ Ward association (For ward-level budget tracking)
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: [true, "Budget must belong to a ward"],
    },

    // 👨‍💼 Officer who approved the budget
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      required: [true, "Please specify who approved the budget"],
    },

    // 💰 Budget amounts
    estimatedCost: {
      type: Number,
      required: [true, "Please provide an estimated cost"],
    },
    amountApproved: {
      type: Number,
      required: [true, "Please specify approved amount"],
    },
    amountUsed: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: function () {
        return this.amountApproved - this.amountUsed;
      },
    },

    // 🧾 Description / Remarks
    remarks: {
      type: String,
      trim: true,
    },

    // 📅 Timeline
    approvedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
    },

    // 📊 Status tracking
    status: {
      type: String,
      enum: ["Approved", "Partially Used", "Completed", "Closed"],
      default: "Approved",
    },

    // 📎 Attachments (like PDF approvals, invoices, bills, etc.)
    documents: [
      {
        fileName: String,
        filePath: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // 🔒 Audit trail for transparency
    history: [
      {
        action: String, // e.g., "Approved", "Updated", "Closed"
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        amountChanged: Number,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

// 🧮 Pre-save middleware to auto-update remainingAmount and status
budgetSchema.pre("save", function (next) {
  this.remainingAmount = this.amountApproved - this.amountUsed;

  if (this.amountUsed === 0) this.status = "Approved";
  else if (this.amountUsed < this.amountApproved)
    this.status = "Partially Used";
  else if (this.amountUsed >= this.amountApproved)
    this.status = "Completed";

  next();
});

export default mongoose.model("Budget", budgetSchema);
