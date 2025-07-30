import { Router } from "express";
import Joi from "joi";
import Task from "../models/task.js";
import Project from "../models/project.js";
import permit from "../middleware/role.js";

const router = Router();

const schema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(""),
  status: Joi.string().valid("todo", "in-progress", "done"),
  projectId: Joi.string().required(),
  assignedTo: Joi.string().allow(null)
});

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
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    // Ensure project belongs to same team
    const project = await Project.findOne({ _id: value.projectId, teamId: req.user.teamId });
    if (!project) return res.status(404).json({ message: "Project not found" });
    const task = await Task.create(value);
    // Emit real-time update
    req.io.to(req.user.teamId.toString()).emit("taskCreated", task);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id
router.put("/:id", permit("ADMIN", "MANAGER"), async (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, value, { new: true });
    if (!updated) return res.status(404).json({ message: "Task not found" });
    req.io.to(req.user.teamId.toString()).emit("taskUpdated", updated);
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
    req.io.to(req.user.teamId.toString()).emit("taskDeleted", removed._id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router; 