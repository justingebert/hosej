import mongoose from "mongoose";
import User from "./user";

const FcmSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    ref: User,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const FcmToken = mongoose.models.FcmToken || mongoose.model("FcmToken", FcmSchema);

export default FcmToken;
