import mongoose from "mongoose";
import type { Model } from "mongoose";
import type { IGroup, IGroupMember, IGroupMethods } from "@/types/models/group";
import { addPointsToMember } from "@/lib/services/group";

const memberSchema = new mongoose.Schema<IGroupMember>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String },
    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastPointDate: { type: Date, default: null },
    joinedAt: { type: Date, default: Date.now },
});

const groupSchema = new mongoose.Schema<
    IGroup,
    Model<IGroup, object, IGroupMethods>,
    IGroupMethods
>({
    name: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [memberSchema],
    features: {
        questions: {
            enabled: { type: Boolean, default: true },
            settings: {
                questionCount: { type: Number, default: 1 },
                lastQuestionDate: { type: Date, default: null },
            },
        },
        rallies: {
            enabled: { type: Boolean, default: true },
            settings: {
                rallyCount: { type: Number, default: 1 },
                rallyGapDays: { type: Number, default: 14 },
            },
        },
        jukebox: {
            enabled: { type: Boolean, default: true },
            settings: {
                concurrent: { type: [String], default: ["Jukebox"] },
                activationDays: { type: [Number], default: [1] },
            },
        },
    },
    createdAt: { type: Date, default: Date.now },
});

/**
 * Adds points to a member and updates their streak.
 * Delegates to the service layer for the actual logic.
 */
groupSchema.methods.addPoints = async function (userId: string, points: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await addPointsToMember(this as any, userId, points);
};

groupSchema.index({ name: 1 });

type GroupModel = Model<IGroup, object, IGroupMethods>;

const Group: GroupModel =
    (mongoose.models.Group as GroupModel) ||
    mongoose.model<IGroup, GroupModel>("Group", groupSchema);

export default Group;
