import express from "express";
import {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudgetUsage,
  addDocument,
  closeBudget,
  deleteBudget,
} from "../controllers/budgetController.js";

const budgetRoutes = express.Router();

budgetRoutes.post("/", createBudget);
budgetRoutes.get("/", getAllBudgets);
budgetRoutes.get("/:id", getBudgetById);
budgetRoutes.patch("/:id/usage", updateBudgetUsage);
budgetRoutes.post("/:id/document", addDocument);
budgetRoutes.patch("/:id/close", closeBudget);
budgetRoutes.delete("/:id", deleteBudget);

export default budgetRoutes;
