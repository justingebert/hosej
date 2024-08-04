import mongoose from "mongoose";
import { IUser } from "./user"; // Import the IUser interface

export interface IGroup extends mongoose.Document {
  name: string;
  description: string;
  members: IUser[]; 
  createdAt: Date;
}
const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }],
    questionCount: { type: Number, default: 1 },
    rallyCount: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
});

groupSchema.index({ name: 1 })

const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);

export default Group;