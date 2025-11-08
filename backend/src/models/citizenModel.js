import mongoose from "mongoose";

const citizenSchema = new mongoose.Schema(
  {
    
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Citizen must be linked to a user account"],
    },

    
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: [true, "Citizen must belong to a ward"],
    },

    
    address: {
      type: String,
      required: [true, "Please enter your address"],
      trim: true,
    },
    pincode: {
      type: String,
      match: [/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit PIN code"],
    },
    geoLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },

   
    alternatePhone: {
      type: String,
      match: [/^[0-9]{10}$/, "Please enter a valid phone number"],
    },

    
    issuesReported: [
      {
        issueId: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" },
        title: String,
        status: {
          type: String,
          enum: [
            "Pending Verification",
            "Verified",
            "Assigned",
            "In Progress",
            "Resolved",
            "Closed",
          ],
        },
        reportedAt: { type: Date, default: Date.now },
      },
    ],

    comments: [
      {
        issueId: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" },
        commentText: String,
        commentedAt: { type: Date, default: Date.now },
      },
    ],


    activityLog: [
      {
        action: String, 
        issueId: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" },
        timestamp: { type: Date, default: Date.now },
      },
    ],

  
    totalIssuesReported: {
      type: Number,
      default: 0,
    },
    totalResolved: {
      type: Number,
      default: 0,
    },
    totalPending: {
      type: Number,
      default: 0,
    },

    
    profileVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    isVerifiedCitizen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, 
  }
);


citizenSchema.pre("save", function (next) {
  if (this.issuesReported) {
    this.totalIssuesReported = this.issuesReported.length;
    this.totalResolved = this.issuesReported.filter(
      (i) => i.status === "Resolved" || i.status === "Closed"
    ).length;
    this.totalPending = this.issuesReported.filter(
      (i) => i.status !== "Resolved" && i.status !== "Closed"
    ).length;
  }
  next();
});

export default mongoose.model("citizen", citizenSchema);
