import mongoose, { Types } from "mongoose";
import { IUser } from "./user"; // Import the IUser interface

export interface IGroup extends mongoose.Document {
  _id: string
  name: string;
  description: string;
  admin: mongoose.Schema.Types.ObjectId | IUser | string;
  members: {
    user: mongoose.Schema.Types.ObjectId | IUser;
    name: string;
    points: number;
    streak: number;
    lastPointDate: Date;
    joinedAt: Date;
  }[],
  questionCount: number;
  lastQuestionDate: Date;
  rallyCount: number;
  rallyGapDays: number;
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
        joinedAt: { type: Date, default: Date.now },
      }
    ],
    questionCount: { type: Number, default: 2 },
    lastQuestionDate: { type: Date, default: null },
    rallyCount: { type: Number, default: 1 },
    rallyGapDays: { type: Number, default: 14 },
    createdAt: { type: Date, default: Date.now },
});

groupSchema.methods.addPoints = async function (userId: string | Types.ObjectId, points: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Standardize to the start of the day

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Get `lastQuestionDate`, or set it far in the past if it's null
  const lastQuestionDate = this.lastQuestionDate ? new Date(this.lastQuestionDate) : new Date(0);
  lastQuestionDate.setHours(0, 0, 0, 0);

  const userIdString = userId.toString();
  const memberEntry = this.members.find(
    (member: any) => member.user.toString() === userIdString
  );

  if (memberEntry) {
    // Add points to the user
    memberEntry.points += points;

    // Update streak logic
    if (memberEntry.lastPointDate && memberEntry.lastPointDate.toDateString() === yesterday.toDateString()) {
      // Increment streak if last points were given yesterday
      memberEntry.streak += 1;
    } else if (memberEntry.lastPointDate && memberEntry.lastPointDate.toDateString() === today.toDateString()) {
      // If points were already added today, do nothing to the streak
    } else if (!this.lastQuestionDate || lastQuestionDate <= yesterday && memberEntry.lastPointDate?.toDateString() === lastQuestionDate.toDateString()) {
      // If `lastQuestionDate` is null or if no question was available yesterday, continue the streak
      memberEntry.streak += 1;
    } else {
      // Reset streak if there was a question after the last points given, but it wasn’t answered
      memberEntry.streak = 1;
    }

    // Update lastPointDate to today
    memberEntry.lastPointDate = today;

    await this.save();
  } else {
    throw new Error("Member not found in group");
  }
};



groupSchema.index({ name: 1 })

const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);

export default Group;