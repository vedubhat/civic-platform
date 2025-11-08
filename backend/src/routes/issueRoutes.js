import express from "express";
import * as ctrl from "../controllers/issueController.js";

const issueRoutes = express.Router();

issueRoutes.post("/", ctrl.createIssue);
issueRoutes.get("/", ctrl.listIssues);
issueRoutes.get("/:id", ctrl.getIssueById);
issueRoutes.patch("/:id", ctrl.updateIssue);

issueRoutes.post("/:id/verify", ctrl.verifyIssue);
issueRoutes.post("/:id/assign", ctrl.assignIssue);
issueRoutes.post("/:id/progress", ctrl.addProgressUpdate);
issueRoutes.post("/:id/comment", ctrl.addComment);
issueRoutes.post("/:id/like", ctrl.toggleLike);
issueRoutes.post("/:id/views", ctrl.incrementViews);

issueRoutes.post("/:id/link-budget", ctrl.linkBudget);
issueRoutes.patch("/:id/archive", ctrl.setArchive);
issueRoutes.delete("/:id", ctrl.deleteIssue);

export default issueRoutes;
