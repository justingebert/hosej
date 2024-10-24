import mongoose, { Types } from "mongoose";
import { IUser } from "./user"; // Import the IUser interface

export interface IGroup extends mongoose.Document {
  _id: string
  name: string;
  description: string;
  members: {
    user: mongoose.Schema.Types.ObjectId | IUser;
    name: string;
    points: number;
    streak: number;
    lastPointDate: Date;
  }[],
  createdAt: Date;
  addPoints(userId: string, points: number): Promise<void>;
}
const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: false },
        points: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        lastPointDate: { type: Date, default: null },
      }
    ],
    questionCount: { type: Number, default: 2 },
    rallyCount: { type: Number, default: 1 },
    rallyGapDays: { type: Number, default: 14 },
    createdAt: { type: Date, default: Date.now },
});

groupSchema.methods.addPoints = async function (userId: string | Types.ObjectId, points: number) {
  const today = new Date();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const userIdString = userId.toString();
  const memberEntry = this.members.find(
    (member: any) => member.user.toString() === userIdString
  );

  if (memberEntry) {
    // Add points
    memberEntry.points += points;

    // Update streak logic
    if (memberEntry.lastPointDate && memberEntry.lastPointDate.toDateString() === yesterday.toDateString()) {
      memberEntry.streak += 1;
    } else if (memberEntry.lastPointDate && memberEntry.lastPointDate.toDateString() === today.toDateString()) {
      // If points were already added today, do nothing to the streak
    } else {
      // Reset streak if points were not added yesterday
      memberEntry.streak = 1;
    }

    // Update lastPointDate
    memberEntry.lastPointDate = today;

    await this.save();
  } else {
    throw new Error('Member not found in group');
  }
};

groupSchema.index({ name: 1 })

const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);

export default Group;