import express from "express";
import http from "http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./routes/index.js";
import { initializeFirebase } from "./config/firebase.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// WebSocket setup
const io = new SocketServer(server, {
  cors: { origin: "*" }
});

// Attach io instance to every request
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Socket.IO auth & rooms
io.use(async (socket, next) => {
  try {
    const { token } = socket.handshake.auth;
    if (!token) return next(new Error("Unauthorized"));
    const decoded = await import("./config/firebase.js").then(m => m.verifyToken(token));
    const User = (await import("./models/user.js")).default;
    const user = await User.findOne({ email: decoded.email });
    if (!user) return next(new Error("User not found"));
    socket.data.user = user;
    if (user.teamId) {
      socket.join(user.teamId.toString());
    }
    // Always join a private room based on user id so they receive personal events
    socket.join(user._id.toString());
    next();
  } catch (err) {
    next(err);
  }
});

// Init services
initializeFirebase();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes (secured)
app.use("/api", router);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server Error" });
});

// DB & Server launch
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => console.log(`🚀 Server ready on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌  Mongo connection error", err);
  }); 