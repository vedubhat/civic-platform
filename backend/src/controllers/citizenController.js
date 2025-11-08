// controllers/citizen.controller.js
import mongoose from "mongoose";
import Citizen from "../models/citizenModel.js"; // adjust path if needed

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create a citizen record (links to an existing User)
export const createCitizen = async (req, res) => {
  try {
    const { userId, wardId, address, pincode, geoLocation, alternatePhone, profileVisibility } = req.body;

    if (!userId || !wardId || !address) {
      return res.status(400).json({ message: "userId, wardId and address are required." });
    }
    if (!isValidId(userId) || !isValidId(wardId)) {
      return res.status(400).json({ message: "Invalid userId or wardId." });
    }

    const existing = await Citizen.findOne({ userId });
    if (existing) return res.status(409).json({ message: "Citizen profile already exists for this user." });

    const citizen = new Citizen({
      userId,
      wardId,
      address,
      pincode,
      geoLocation,
      alternatePhone,
      profileVisibility,
    });

    await citizen.save();
    return res.status(201).json(citizen);
  } catch (err) {
    console.error("createCitizen error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get citizen by id (with optional population)
export const getCitizenById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid citizen id." });

    const citizen = await Citizen.findById(id)
      .populate("userId", "name email phone")
      .populate("wardId", "name")
      .lean();

    if (!citizen) return res.status(404).json({ message: "Citizen not found." });

    return res.json(citizen);
  } catch (err) {
    console.error("getCitizenById error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// List citizens (filters + pagination)
export const listCitizens = async (req, res) => {
  try {
    const { wardId, verified, q, page = 1, limit = 20, sortBy = "createdAt", sortDir = "desc" } = req.query;
    const filter = {};

    if (wardId && isValidId(wardId)) filter.wardId = wardId;
    if (typeof verified !== "undefined") filter.isVerifiedCitizen = verified === "true";
    if (q) {
      // search address or alternatePhone
      filter.$or = [{ address: new RegExp(q, "i") }, { alternatePhone: new RegExp(q, "i") }];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
    const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };

    const [items, total] = await Promise.all([
      Citizen.find(filter).skip(skip).limit(parseInt(limit)).sort(sort).lean(),
      Citizen.countDocuments(filter),
    ]);

    return res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("listCitizens error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Partial update
export const updateCitizen = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // prevent linking to another user unintentionally
    delete updates.userId;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid citizen id." });

    const updated = await Citizen.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: "Citizen not found." });

    return res.json(updated);
  } catch (err) {
    console.error("updateCitizen error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add a reported issue entry (keeps quick reference fields)
export const addReportedIssue = async (req, res) => {
  try {
    const { citizenId } = req.params;
    const { issueId, title, status = "Pending Verification", reportedAt } = req.body;

    if (!isValidId(citizenId) || !isValidId(issueId)) return res.status(400).json({ message: "Invalid IDs." });

    const citizen = await Citizen.findById(citizenId);
    if (!citizen) return res.status(404).json({ message: "Citizen not found." });

    // Prevent duplicates
    const exists = citizen.issuesReported.some((i) => i.issueId && i.issueId.equals(issueId));
    if (exists) return res.status(409).json({ message: "Issue already recorded for this citizen." });

    citizen.issuesReported.push({ issueId, title, status, reportedAt: reportedAt || Date.now() });

    // totals will be recalculated by pre-save hook, but do it here too for immediate consistency
    citizen.totalIssuesReported = citizen.issuesReported.length;
    citizen.totalResolved = citizen.issuesReported.filter((i) => i.status === "Resolved" || i.status === "Closed").length;
    citizen.totalPending = citizen.issuesReported.filter((i) => i.status !== "Resolved" && i.status !== "Closed").length;

    citizen.activityLog.push({ action: "Reported Issue", issueId, timestamp: Date.now() });

    await citizen.save();
    return res.status(201).json({ message: "Issue recorded.", issuesReported: citizen.issuesReported });
  } catch (err) {
    console.error("addReportedIssue error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update status of an issue inside issuesReported (e.g., when resolved)
export const updateReportedIssueStatus = async (req, res) => {
  try {
    const { citizenId, issueId } = req.params;
    const { status } = req.body;

    if (!isValidId(citizenId) || !isValidId(issueId)) return res.status(400).json({ message: "Invalid IDs." });
    if (!status) return res.status(400).json({ message: "status is required." });

    const citizen = await Citizen.findById(citizenId);
    if (!citizen) return res.status(404).json({ message: "Citizen not found." });

    const entry = citizen.issuesReported.find((i) => i.issueId && i.issueId.equals(issueId));
    if (!entry) return res.status(404).json({ message: "Reported issue not found for this citizen." });

    entry.status = status;

    // recalc totals
    citizen.totalResolved = citizen.issuesReported.filter((i) => i.status === "Resolved" || i.status === "Closed").length;
    citizen.totalPending = citizen.issuesReported.filter((i) => i.status !== "Resolved" && i.status !== "Closed").length;

    citizen.activityLog.push({ action: `Issue status updated to ${status}`, issueId, timestamp: Date.now() });

    await citizen.save();
    return res.json({ message: "Issue status updated.", entry });
  } catch (err) {
    console.error("updateReportedIssueStatus error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add a comment reference
export const addComment = async (req, res) => {
  try {
    const { citizenId } = req.params;
    const { issueId, commentText } = req.body;

    if (!isValidId(citizenId) || (issueId && !isValidId(issueId)) || !commentText)
      return res.status(400).json({ message: "Invalid payload." });

    const citizen = await Citizen.findById(citizenId);
    if (!citizen) return res.status(404).json({ message: "Citizen not found." });

    citizen.comments.push({ issueId, commentText, commentedAt: Date.now() });
    citizen.activityLog.push({ action: "Commented", issueId, timestamp: Date.now() });

    await citizen.save();
    return res.status(201).json({ message: "Comment added.", comments: citizen.comments });
  } catch (err) {
    console.error("addComment error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Record a generic activity (manual log)
export const recordActivity = async (req, res) => {
  try {
    const { citizenId } = req.params;
    const { action, issueId } = req.body;

    if (!isValidId(citizenId) || !action) return res.status(400).json({ message: "Invalid payload." });

    const citizen = await Citizen.findById(citizenId);
    if (!citizen) return res.status(404).json({ message: "Citizen not found." });

    citizen.activityLog.push({ action, issueId, timestamp: Date.now() });
    await citizen.save();
    return res.json({ message: "Activity recorded.", activityLog: citizen.activityLog });
  } catch (err) {
    console.error("recordActivity error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Verify citizen (admin action)
export const verifyCitizen = async (req, res) => {
  try {
    const { id } = req.params;
    const { verify = true } = req.body;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid citizen id." });

    const citizen = await Citizen.findById(id);
    if (!citizen) return res.status(404).json({ message: "Citizen not found." });

    citizen.isVerifiedCitizen = !!verify;
    citizen.activityLog.push({ action: verify ? "Verified as citizen" : "Unverified citizen", timestamp: Date.now() });

    await citizen.save();
    return res.json({ message: verify ? "Citizen verified." : "Citizen unverified.", citizen });
  } catch (err) {
    console.error("verifyCitizen error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Archive / Restore citizen record
export const setArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive = true } = req.body;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid citizen id." });

    const citizen = await Citizen.findById(id);
    if (!citizen) return res.status(404).json({ message: "Citizen not found." });

    citizen.isArchived = !!archive;
    // optional: flip isActive (if you use such a field)
    if (typeof citizen.isActive !== "undefined") citizen.isActive = archive ? false : true;

    citizen.activityLog.push({ action: archive ? "Archived profile" : "Restored profile", timestamp: Date.now() });

    await citizen.save();
    return res.json({ message: archive ? "Archived" : "Restored", citizen });
  } catch (err) {
    console.error("setArchive error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete citizen (admin)
export const deleteCitizen = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid citizen id." });

    const deleted = await Citizen.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Citizen not found." });

    return res.json({ message: "Citizen deleted." });
  } catch (err) {
    console.error("deleteCitizen error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
