import { Router } from "express";
import Joi from "joi";
import Project from "../models/project.js";
import permit from "../middleware/role.js";

const router = Router();

const schema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow("")
});

// GET /api/projects
router.get("/", async (req, res, next) => {
  try {
    const projects = await Project.find({ teamId: req.user.teamId });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects (Admin & Manager)
router.post("/", permit("ADMIN", "MANAGER"), async (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const project = await Project.create({ ...value, teamId: req.user.teamId });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id
router.put("/:id", permit("ADMIN", "MANAGER"), async (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const updated = await Project.findOneAndUpdate(
      { _id: req.params.id, teamId: req.user.teamId },
      value,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Project not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id (Admin only)
router.delete("/:id", permit("ADMIN"), async (req, res, next) => {
  try {
    const removed = await Project.findOneAndDelete({ _id: req.params.id, teamId: req.user.teamId });
    if (!removed) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router; 