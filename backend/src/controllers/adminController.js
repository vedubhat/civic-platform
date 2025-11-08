// controllers/user.controller.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import User from "../models/adminmodel.js"


const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ✅ Helper - create JWT token
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, roles: user.roles },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// ✅ Register a new user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "Username, email and password are required." });

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser)
      return res.status(409).json({ message: "Username or email already exists." });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({
      username,
      email,
      password: hashed,
      roles: roles && roles.length ? roles : undefined,
    });

    await user.save();

    const token = createToken(user);
    const { password: _, ...userData } = user.toObject();

    res.status(201).json({ message: "User registered successfully.", user: userData, token });
  } catch (err) {
    console.error("registerUser error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    const token = createToken(user);
    const { password: _, ...userData } = user.toObject();

    res.json({ message: "Login successful.", user: userData, token });
  } catch (err) {
    console.error("loginUser error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    console.error("getUserById error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Update user profile or roles
export const updateUser = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (roles) updateData.roles = roles;
    if (password) {
      updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    updateData.updatedAt = Date.now();

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({ message: "User updated successfully.", user });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Delete user
export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found." });

    res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get current user (from token)
export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Authorization header missing." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({ user });
  } catch (err) {
    console.error("getCurrentUser error:", err);
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
