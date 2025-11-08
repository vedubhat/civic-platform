import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    // 🧍‍♂️ Citizen who reported the issue
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Citizen",
      required: [true, "Issue must be reported by a citizen"],
    },

    // 🏙️ Ward association
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: [true, "Issue must belong to a ward"],
    },

    // 📋 Basic issue info
    title: {
      type: String,
      required: [true, "Issue title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide an issue description"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Lighting",
        "Waste Management",
        "Roads",
        "Water Supply",
        "Drainage",
        "Public Health",
        "Others",
      ],
      default: "Others",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    // 📍 Location details
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      landmark: { type: String },
    },

    // 🖼️ Image evidence
    images: [
      {
        type: String, // URL or file path
      },
    ],

    // 🔄 Workflow tracking
    status: {
      type: String,
      enum: [
        "Pending Verification",
        "Verified",
        "Rejected",
        "Assigned",
        "In Progress",
        "Resolved",
        "Closed",
      ],
      default: "Pending Verification",
    },

    // 🧑‍💼 Ward Representative who verified
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WardRep",
    },
    verificationRemark: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },

    // 🏢 Officer responsible
    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
    },

    // 👷 Worker assigned (optional)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
    },
    assignedAt: {
      type: Date,
    },

    // 🚧 Progress tracking
    progressUpdates: [
      {
        status: {
          type: String,
          enum: [
            "Assigned",
            "In Progress",
            "Work Halted",
            "Resolved",
            "Closed",
          ],
        },
        remark: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        photo: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // 💰 Budget tracking
    estimatedCost: {
      type: Number,
      default: 0,
    },
    budgetUsed: {
      type: Number,
      default: 0,
    },
    budgetDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
    },

    // 📅 Timeline
    createdAt: {
      type: Date,
      default: Date.now,
    },
    verifiedDate: Date,
    resolvedDate: Date,
    closedDate: Date,

    // 📊 Transparency
    visibility: {
      type: String,
      enum: ["public", "ward_only"],
      default: "public",
    },

    // 💬 Comments
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // 📈 Analytics fields
    likes: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        likedAt: { type: Date, default: Date.now },
      },
    ],
    views: {
      type: Number,
      default: 0,
    },

    // 🗃️ Post reference (for social feed)
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },

    // ⚙️ Flags
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

export default mongoose.model("Issue", issueSchema);
