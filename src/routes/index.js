import { Router } from "express";
import auth from "../middleware/auth.js";
import projects from "./projects.js";
import tasks from "./tasks.js";
import messages from "./messages.js";
import team from "./team.js";

const router = Router();

// Auth middleware for all routes below
// router.use(auth);
// Temporary mock user middleware for testing without auth
router.use((req, res, next) => {
  req.user = {
    _id: "64b7f8c2f1a2b3c4d5e6f7a8",
    email: "test@example.com",
    name: "Test User",
    role: "ADMIN",
    teamId: "64b7f8c2f1a2b3c4d5e6f7b9"
  };
  next();
});

router.use("/projects", projects);
router.use("/tasks", tasks);
router.use("/messages", messages);
router.use("/team", team);

export default router; 