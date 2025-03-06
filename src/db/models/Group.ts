import mongoose, { Types } from "mongoose";

const memberSchema = new mongoose.Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  name: { type: String },
  points: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastPointDate: { type: Date, default: null },
  joinedAt: { type: Date, default: Date.now },
});

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [memberSchema],
    questionCount: { type: Number, default: 1 },
    lastQuestionDate: { type: Date, default: null },
    rallyCount: { type: Number, default: 1 },
    rallyGapDays: { type: Number, default: 14 },
    jukebox: { type: Boolean, default: true },
    jukeboxFrequency: { type: Number, default: 30 }, //days not implemented yet
    spotifyConneceted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

groupSchema.methods.addPoints = async function (userId:Types.ObjectId, points: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Standardize to the start of the day

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Get `lastQuestionDate`, or set it far in the past if it's null
    const lastQuestionDate = this.lastQuestionDate ? new Date(this.lastQuestionDate) : new Date(0);
    lastQuestionDate.setHours(0, 0, 0, 0);

    const memberEntry = this.members.find((member: any) => member.user.toString() === userId.toString());
    if (memberEntry) {
        memberEntry.points += points;

        if (
            memberEntry.lastPointDate &&
            memberEntry.lastPointDate.toDateString() === yesterday.toDateString()
        ) {
            // Increment streak if last points were given yesterday
            memberEntry.streak += 1;
        } else if (
            memberEntry.lastPointDate &&
            memberEntry.lastPointDate.toDateString() === today.toDateString()
        ) {
            // If points were already added today, do nothing to the streak
        } else if (
            !this.lastQuestionDate ||
            (lastQuestionDate <= yesterday &&
                memberEntry.lastPointDate?.toDateString() === lastQuestionDate.toDateString())
        ) {
            //no questions, continue the streak
            memberEntry.streak += 1;
        } else {
            // Reset streak
            memberEntry.streak = 1;
        }

        memberEntry.lastPointDate = today;

        await this.save();
    } else {
        throw new Error("Member not found in group");
    }
};

groupSchema.index({ name: 1 });

const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);

export default Group;
