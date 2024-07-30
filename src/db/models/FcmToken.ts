import mongoose from "mongoose";

const FcmSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const FcmToken = mongoose.models.FcmToken || mongoose.model("FcmToken", FcmSchema);

export default FcmToken;
