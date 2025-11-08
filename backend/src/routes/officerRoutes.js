import express from "express";
import { createOfficer } from "../controllers/officerController.js";

const officerRoutes = express.Router();

officerRoutes.post("/create", createOfficer);

export default officerRoutes;
