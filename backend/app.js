import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// import morgan from "morgan";
import connectDB from "./src/config/db.js";
import officerRoutes from './src/routes/officerRoutes.js'

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
export default app;