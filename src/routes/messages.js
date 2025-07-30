import { Router } from "express";
import Joi from "joi";
import Message from "../models/message.js";

const router = Router();

const schema = Joi.object({
  content: Joi.string().required()
});

// GET /api/messages
router.get("/", async (req, res, next) => {
  try {
    const msgs = await Message.find({ teamId: req.user.teamId }).sort({ timestamp: 1 });
    res.json(msgs);
  } catch (err) {
    next(err);
  }
});

// POST /api/messages
router.post("/", async (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const msg = await Message.create({
      content: value.content,
      senderId: req.user._id,
      teamId: req.user.teamId
    });
    // Broadcast to team room via Socket.IO
    req.io.to(req.user.teamId.toString()).emit("newMessage", msg);
    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
});

export default router; 