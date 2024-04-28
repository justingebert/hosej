import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }],
    createdAt: { type: Date, default: Date.now },
});

const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);

export default Group;