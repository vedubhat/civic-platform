// controllers/issue.controller.js
import mongoose from "mongoose";
import Issue from "../models/issueModel.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create issue
export const createIssue = async (req, res) => {
  try {
    const {
      citizenId,
      wardId,
      title,
      description,
      category,
      priority,
      location,
      images,
      estimatedCost,
      visibility,
      postId,
    } = req.body;

    if (!citizenId || !wardId || !title || !description) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const issue = new Issue({
      citizenId,
      wardId,
      title,
      description,
      category,
      priority,
      location,
      images,
      estimatedCost,
      visibility,
      postId,
    });

    await issue.save();
    return res.status(201).json(issue);
  } catch (err) {
    console.error("createIssue error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get single issue by id (with useful populates)
export const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid issue id." });

    const issue = await Issue.findById(id)
      .populate("citizenId", "name phone")
      .populate("wardId", "name")
      .populate("verifiedBy", "name")
      .populate("officerId", "name position")
      .populate("assignedTo", "name")
      .populate("budgetDetails");

    if (!issue) return res.status(404).json({ message: "Issue not found." });

    return res.json(issue);
  } catch (err) {
    console.error("getIssueById error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// List issues with filters, search, pagination & sorting
export const listIssues = async (req, res) => {
  try {
    const {
      wardId,
      status,
      category,
      priority,
      citizenId,
      q, // text search on title/description
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query;

    const filter = { isActive: true, isArchived: false };

    if (wardId && isValidId(wardId)) filter.wardId = wardId;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (citizenId && isValidId(citizenId)) filter.citizenId = citizenId;
    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
    const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };

    const [items, total] = await Promise.all([
      Issue.find(filter).skip(skip).limit(parseInt(limit)).sort(sort).lean(),
      Issue.countDocuments(filter),
    ]);

    return res.json({
      items,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("listIssues error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Partial update (fields allowed)
export const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Do not allow certain direct state changes here (use dedicated endpoints)
    delete updates.verifiedBy;
    delete updates.verifiedAt;
    delete updates.status;
    delete updates.verifiedDate;
    delete updates.resolvedDate;
    delete updates.closedDate;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid issue id." });

    const updated = await Issue.findByIdAndUpdate(id, updates, { new: true }).select("-__v");
    if (!updated) return res.status(404).json({ message: "Issue not found." });

    return res.json(updated);
  } catch (err) {
    console.error("updateIssue error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Verify an issue (ward rep)
export const verifyIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { wardRepId, verificationRemark, accept = true } = req.body;

    if (!isValidId(id) || !isValidId(wardRepId))
      return res.status(400).json({ message: "Invalid IDs." });

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    issue.verifiedBy = wardRepId;
    issue.verificationRemark = verificationRemark || (accept ? "Verified" : "Rejected");
    issue.verifiedAt = Date.now();
    issue.status = accept ? "Verified" : "Rejected";
    issue.verifiedDate = Date.now();

    await issue.save();
    return res.json(issue);
  } catch (err) {
    console.error("verifyIssue error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Assign to officer or worker
export const assignIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { officerId, workerId, assignedBy } = req.body;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid issue id." });
    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    if (officerId) {
      if (!isValidId(officerId)) return res.status(400).json({ message: "Invalid officer id." });
      issue.officerId = officerId;
      issue.status = "Assigned";
    }
    if (workerId) {
      if (!isValidId(workerId)) return res.status(400).json({ message: "Invalid worker id." });
      issue.assignedTo = workerId;
      issue.assignedAt = Date.now();
      issue.status = "Assigned";
    }

    if (assignedBy) {
      issue.progressUpdates.push({
        status: "Assigned",
        remark: `Assigned by ${assignedBy}`,
        updatedBy: assignedBy,
      });
    }

    await issue.save();
    return res.json(issue);
  } catch (err) {
    console.error("assignIssue error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add progress update
export const addProgressUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark, updatedBy, photo } = req.body;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid issue id." });
    if (!status) return res.status(400).json({ message: "Status is required." });

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    issue.progressUpdates.push({ status, remark, updatedBy, photo, timestamp: Date.now() });

    // update top-level fields for convenience
    if (status === "Resolved") {
      issue.resolvedDate = Date.now();
      issue.status = "Resolved";
    } else if (status === "Closed") {
      issue.closedDate = Date.now();
      issue.status = "Closed";
    } else {
      issue.status = status;
    }

    await issue.save();
    return res.json(issue);
  } catch (err) {
    console.error("addProgressUpdate error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add comment
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text } = req.body;
    if (!isValidId(id) || !isValidId(userId) || !text)
      return res.status(400).json({ message: "Invalid payload." });

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    issue.comments.push({ userId, text, timestamp: Date.now() });
    await issue.save();
    return res.status(201).json({ message: "Comment added.", comments: issue.comments });
  } catch (err) {
    console.error("addComment error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Like / Unlike
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!isValidId(id) || !isValidId(userId)) return res.status(400).json({ message: "Invalid IDs." });

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    const exists = issue.likes.find((l) => l.userId.equals(userId));
    if (exists) {
      issue.likes = issue.likes.filter((l) => !l.userId.equals(userId));
    } else {
      issue.likes.push({ userId, likedAt: Date.now() });
    }

    await issue.save();
    return res.json({ likesCount: issue.likes.length, liked: !exists });
  } catch (err) {
    console.error("toggleLike error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Increment views (useful to call from frontend when viewing)
export const incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid issue id." });

    const issue = await Issue.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).select("views");
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    return res.json({ views: issue.views });
  } catch (err) {
    console.error("incrementViews error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Link budget record to issue
export const linkBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { budgetId } = req.body;
    if (!isValidId(id) || !isValidId(budgetId)) return res.status(400).json({ message: "Invalid IDs." });

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    issue.budgetDetails = budgetId;
    await issue.save();
    return res.json({ message: "Budget linked.", budgetDetails: issue.budgetDetails });
  } catch (err) {
    console.error("linkBudget error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Archive / Restore
export const setArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive = true } = req.body;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid issue id." });
    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    issue.isArchived = !!archive;
    issue.isActive = archive ? false : true;
    await issue.save();
    return res.json({ message: archive ? "Archived" : "Restored", issue });
  } catch (err) {
    console.error("setArchive error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete issue (admin)
export const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid issue id." });

    const deleted = await Issue.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Issue not found." });

    return res.json({ message: "Issue deleted." });
  } catch (err) {
    console.error("deleteIssue error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
