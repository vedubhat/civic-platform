import express from "express";
import * as ctrl from "../controllers/citizenController.js";

const citizenRoutes = express.Router();

citizenRoutes.post("/", ctrl.createCitizen);
citizenRoutes.get("/", ctrl.listCitizens);
citizenRoutes.get("/:id", ctrl.getCitizenById);
citizenRoutes.patch("/:id", ctrl.updateCitizen);

citizenRoutes.post("/:citizenId/report-issue", ctrl.addReportedIssue);
citizenRoutes.patch("/:citizenId/report-issue/:issueId", ctrl.updateReportedIssueStatus);

citizenRoutes.post("/:citizenId/comment", ctrl.addComment);
citizenRoutes.post("/:citizenId/activity", ctrl.recordActivity);

citizenRoutes.patch("/:id/verify", ctrl.verifyCitizen);
citizenRoutes.patch("/:id/archive", ctrl.setArchive);
citizenRoutes.delete("/:id", ctrl.deleteCitizen);

export default citizenRoutes;
