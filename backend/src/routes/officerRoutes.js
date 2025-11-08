import express from "express";
import { createOfficer } from "../controllers/officerController.js";

const router = express.Router();

router.post("/create", createOfficer);

export default router;
