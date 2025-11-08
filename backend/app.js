import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// import morgan from "morgan";
import connectDB from "./src/config/db.js";
import officerRoutes from './src/routes/officerRoutes.js';
import citizenRoutes from './src/routes/citizenRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import budgetRoutes from './src/routes/budgetRoutes.js';
import issueRoutes from './src/routes/issueRoutes.js';
import wardRoutes from './src/routes/wardRouters.js';


dotenv.config();
connectDB(); // 👈 connect to MongoDB Atlas

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
// app.use(morgan("dev"));

// Test route
app.get("/", (req, res) => {
  res.send("Civic Backend API is running...");
});

app.use("/api/officers", officerRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/issue", issueRoutes);
app.use("/api/ward", wardRoutes);

export default app;