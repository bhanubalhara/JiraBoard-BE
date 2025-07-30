import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "MANAGER", "MEMBER"], default: "MEMBER" },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema); 