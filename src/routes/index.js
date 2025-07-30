import { Router } from "express";
import auth from "../middleware/auth.js";
import projects from "./projects.js";
import tasks from "./tasks.js";
import messages from "./messages.js";
import team from "./team.js";

const router = Router();

// Auth middleware for all routes below
router.use(auth);

router.use("/projects", projects);
router.use("/tasks", tasks);
router.use("/messages", messages);
router.use("/team", team);

export default router; 