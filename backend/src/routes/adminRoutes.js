import express from "express";
const adminRoutes = express.Router();
import { registerUser, loginUser, getAllUsers, getCurrentUser, getUserById, updateUser, deleteUser} from "../controllers/adminController.js"

// Public routes
adminRoutes.post("/register",  registerUser);
adminRoutes.post("/login",  loginUser);

// Protected routes (attach auth middleware later)
adminRoutes.get("/",  getAllUsers);
adminRoutes.get("/me",  getCurrentUser);
adminRoutes.get("/:id",  getUserById);
adminRoutes.patch("/:id",  updateUser);
adminRoutes.delete("/:id",  deleteUser);

export default adminRoutes;
