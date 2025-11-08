// controllers/budget.controller.js
import budgetSchema from "../models/budgetModel.js";
import mongoose from "mongoose";

// ✅ Create new budget
export const createBudget = async (req, res) => {
  try {
    const {
      issueId,
      wardId,
      approvedBy,
      estimatedCost,
      amountApproved,
      amountUsed,
      remarks,
      documents,
    } = req.body;

    if (!issueId || !wardId || !approvedBy || !estimatedCost || !amountApproved) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const budget = new budgetSchema({
      issueId,
      wardId,
      approvedBy,
      estimatedCost,
      amountApproved,
      amountUsed: amountUsed || 0,
      remarks,
      documents,
      history: [
        {
          action: "Approved",
          by: approvedBy,
          amountChanged: amountApproved,
          note: "Initial budget approval",
        },
      ],
    });

    await budget.save();
    return res.status(201).json(budget);
  } catch (err) {
    console.error("createBudget error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get all budgets (filter by ward or issue)
export const getAllBudgets = async (req, res) => {
  try {
    const { wardId, issueId } = req.query;
    const filter = {};
    if (wardId) filter.wardId = wardId;
    if (issueId) filter.issueId = issueId;

    const budgets = await budgetSchema.find(filter)
      .populate("issueId", "title status")
      .populate("wardId", "name")
      .populate("approvedBy", "name position")
      .lean();

    res.json(budgets);
  } catch (err) {
    console.error("getAllBudgets error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get single budget by ID
export const getBudgetById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid budget ID." });

    const budget = await budgetSchema.findById(id)
      .populate("issueId", "title status")
      .populate("wardId", "name")
      .populate("approvedBy", "name position")
      .populate("history.by", "name role");

    if (!budget) return res.status(404).json({ message: "Budget not found." });

    res.json(budget);
  } catch (err) {
    console.error("getBudgetById error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Update spending (amountUsed)
export const updateBudgetUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountUsed, by, note } = req.body;

    if (!amountUsed && amountUsed !== 0)
      return res.status(400).json({ message: "amountUsed is required." });

    const budget = await budgetSchema.findById(id);
    if (!budget) return res.status(404).json({ message: "Budget not found." });

    // Update usage and status automatically
    budget.amountUsed = amountUsed;
    budget.remainingAmount = budget.amountApproved - amountUsed;
    budget.updatedAt = Date.now();

    if (amountUsed === 0) budget.status = "Approved";
    else if (amountUsed < budget.amountApproved) budget.status = "Partially Used";
    else budget.status = "Completed";

    budget.history.push({
      action: "Updated",
      by,
      amountChanged: amountUsed,
      note: note || "Updated budget usage",
    });

    await budget.save();
    res.json(budget);
  } catch (err) {
    console.error("updateBudgetUsage error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Add document (file upload metadata)
export const addDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, filePath, by, note } = req.body;

    const budget = await budgetSchema.findById(id);
    if (!budget) return res.status(404).json({ message: "Budget not found." });

    budget.documents.push({ fileName, filePath });
    budget.history.push({
      action: "Document Added",
      by,
      note: note || "New document uploaded",
    });

    await budget.save();
    res.json({ message: "Document added", documents: budget.documents });
  } catch (err) {
    console.error("addDocument error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Close budget
export const closeBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { by, note } = req.body;

    const budget = await budgetSchema.findById(id);
    if (!budget) return res.status(404).json({ message: "Budget not found." });

    budget.status = "Closed";
    budget.closedAt = Date.now();
    budget.history.push({
      action: "Closed",
      by,
      note: note || "Budget closed",
    });

    await budget.save();
    res.json({ message: "Budget closed successfully", budget });
  } catch (err) {
    console.error("closeBudget error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Delete budget (admin use)
export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await budgetSchema.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Budget not found." });

    res.json({ message: "Budget deleted successfully." });
  } catch (err) {
    console.error("deleteBudget error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
