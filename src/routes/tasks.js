import { Router } from "express";
import Joi from "joi";
import Task from "../models/task.js";
import Project from "../models/project.js";
import Message from "../models/message.js";
import permit from "../middleware/role.js";

const router = Router();

// Validation schemas
const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(""),
  status: Joi.string().valid("todo", "in-progress", "done"),
  projectId: Joi.string().required(),
  assignedTo: Joi.string().allow(null)
});

// Allow partial updates – at least one field must be present
const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow(""),
  status: Joi.string().valid("todo", "in-progress", "done"),
  assignedTo: Joi.string().allow(null)
}).min(1);

// GET /api/tasks?projectId=...
router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find({ projectId: req.query.projectId });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post("/", permit("ADMIN", "MANAGER"), async (req, res, next) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    // Ensure project belongs to same team
    const project = await Project.findOne({ _id: value.projectId, teamId: req.user.teamId });
    if (!project) return res.status(404).json({ message: "Project not found" });
    const task = await Task.create(value);
    // Emit real-time update to appropriate room
    let room;
    if (req.user.teamId) room = req.user.teamId.toString();
    else room = req.user._id.toString();
    req.io.to(room).emit("taskCreated", task);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id
router.put("/:id", permit("ADMIN", "MANAGER"), async (req, res, next) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, value, { new: true });
    if (!updated) return res.status(404).json({ message: "Task not found" });

    const roomU = req.user.teamId ? req.user.teamId.toString() : req.user._id.toString();

    // Broadcast task update
    req.io.to(roomU).emit("taskUpdated", updated);

    // Also create a chat message about the status change (if status changed)
    if (value.status) {
      const readable = value.status.replace(/-/g, " ");
      const msgContent = `${req.user.name} moved task \"${updated.title}\" to ${readable}.`;
      let msg = await Message.create({
        content: msgContent,
        senderId: req.user._id,
        teamId: req.user.teamId || undefined,
      });
      msg = await msg.populate("senderId", "name");
      req.io.to(roomU).emit("newMessage", msg);
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", permit("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const removed = await Task.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Task not found" });
    const roomD = req.user.teamId ? req.user.teamId.toString() : req.user._id.toString();
    req.io.to(roomD).emit("taskDeleted", removed._id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router; 