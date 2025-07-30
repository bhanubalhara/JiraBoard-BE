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

export default router; 