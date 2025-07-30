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
    const filter = req.user.teamId ? { teamId: req.user.teamId } : { senderId: req.user._id };
    const msgs = await Message.find(filter).populate("senderId", "name").sort({ timestamp: 1 });
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
    let msg = await Message.create({
      content: value.content,
      senderId: req.user._id,
      teamId: req.user.teamId || undefined
    });

    msg = await msg.populate("senderId", "name");
    // Determine room for broadcast
    let room;
    if (req.user.teamId) {
      room = req.user.teamId.toString();
    } else if (req.user._id) {
      room = req.user._id.toString();
    }
    if (room) {
      req.io.to(room).emit("newMessage", msg);
    } else {
      // fallback broadcast to all if no room could be determined (should not happen)
      req.io.emit("newMessage", msg);
    }
    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
});

export default router; 