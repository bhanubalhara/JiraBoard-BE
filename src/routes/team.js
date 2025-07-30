import { Router } from "express";
import User from "../models/user.js";

const router = Router();

// GET /api/team/members
router.get("/members", async (req, res, next) => {
  try {
    const members = await User.find({ teamId: req.user.teamId }).select("name email role");
    res.json(members);
  } catch (err) {
    next(err);
  }
});

// GET /api/team/promote?email=...&role=...
router.get("/promote", async (req, res, next) => {
  const { email, role } = req.query;
  if (!email || !role) return res.status(400).json({ message: "email and role query params required" });
  if (!["ADMIN", "MANAGER", "MEMBER"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  try {
    const updated = await User.findOneAndUpdate({ email }, { role }, { new: true });
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
});

export default router; 