// controllers/wardRep.controller.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import wardRepSchema from "../models/wardModel.js"
import mongoose from "mongoose";

// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const wardRepSchema = require('../models/wardModel'); // adjust path if needed
// const mongoose = require('mongoose');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper: create JWT
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Register a new ward representative
export const registerWardRep = async (req, res) => {
  try {
    const { wardLeaderId, name, email, phone, password, ward, area, address, citizenMeetDays, yearsOfExperience } = req.body;

    if (!wardLeaderId || !name || !email || !phone || !password || !ward) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Check duplicates
    const existing = await wardRepSchema.findOne({
      $or: [{ wardLeaderId }, { email }]
    });
    if (existing) return res.status(409).json({ message: 'wardLeaderId or email already in use.' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const rep = new wardRepSchema({
      wardLeaderId,
      name,
      email,
      phone,
      password: hashed,
      ward,
      area,
      address,
      citizenMeetDays,
      yearsOfExperience
    });

    await rep.save();

    const token = createToken({ id: rep._id, role: rep.role });

    // Don't return password
    const repObj = rep.toObject();
    delete repObj.password;

    return res.status(201).json({ wardRep: repObj, token });
  } catch (err) {
    console.error('registerWardRep error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login
export const loginWardRep = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const rep = await wardRepSchema.findOne({ email });
    if (!rep) return res.status(401).json({ message: 'Invalid credentials.' });

    const ok = await bcrypt.compare(password, rep.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = createToken({ id: rep._id, role: rep.role });

    const repObj = rep.toObject();
    delete repObj.password;

    return res.json({ wardRep: repObj, token });
  } catch (err) {
    console.error('loginWardRep error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get ward rep by id
export const getWardRepById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id.' });

    const rep = await wardRepSchema.findById(id).populate('verifiedIssues');
    if (!rep) return res.status(404).json({ message: 'wardRepSchema not found.' });

    const repObj = rep.toObject();
    delete repObj.password;
    return res.json(repObj);
  } catch (err) {
    console.error('getWardRepById error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// List all ward reps (with pagination)
export const listWardReps = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      wardRepSchema.find({})
        .skip(skip)
        .limit(limit)
        .select('-password')
        .lean(),
      wardRepSchema.countDocuments()
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error('listWardReps error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update ward rep (partial update)
export const updateWardRep = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = { ...req.body };

    // prevent updating unique identifiers accidentally
    delete updates.wardLeaderId;
    delete updates.email; // if you want to allow email change, add extra checks (verification) here
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }

    const rep = await wardRepSchema.findByIdAndUpdate(id, updates, { new: true }).select('-password');

    if (!rep) return res.status(404).json({ message: 'wardRepSchema not found.' });

    return res.json(rep);
  } catch (err) {
    console.error('updateWardRep error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete ward rep
export const deleteWardRep = async (req, res) => {
  try {
    const id = req.params.id;
    const rep = await wardRepSchema.findByIdAndDelete(id);
    if (!rep) return res.status(404).json({ message: 'wardRepSchema not found.' });
    return res.json({ message: 'Deleted successfully.' });
  } catch (err) {
    console.error('deleteWardRep error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Add a verified issue to the ward representative
export const addVerifiedIssue = async (req, res) => {
  try {
    const { repId, issueId } = req.body;
    if (!repId || !issueId) return res.status(400).json({ message: 'repId and issueId required.' });

    if (!mongoose.Types.ObjectId.isValid(repId) || !mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({ message: 'Invalid IDs.' });
    }

    const rep = await wardRepSchema.findById(repId);
    if (!rep) return res.status(404).json({ message: 'wardRepSchema not found.' });

    // Prevent duplicates
    if (rep.verifiedIssues.some(i => i.equals(issueId))) {
      return res.status(409).json({ message: 'Issue already verified by this rep.' });
    }

    rep.verifiedIssues.push(issueId);
    rep.totalResolvedIssues = rep.verifiedIssues.length;
    await rep.save();

    return res.json({ message: 'Issue added to verifiedIssues.', verifiedIssues: rep.verifiedIssues });
  } catch (err) {
    console.error('addVerifiedIssue error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Increment resolved issues counter (alternative to addVerifiedIssue)
export const incrementResolvedIssues = async (req, res) => {
  try {
    const id = req.params.id;
    const delta = parseInt(req.body.delta) || 1;

    const rep = await wardRepSchema.findByIdAndUpdate(
      id,
      { $inc: { totalResolvedIssues: delta } },
      { new: true }
    ).select('-password');

    if (!rep) return res.status(404).json({ message: 'wardRepSchema not found.' });

    return res.json(rep);
  } catch (err) {
    console.error('incrementResolvedIssues error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
