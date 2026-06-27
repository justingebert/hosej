import mongoose from "mongoose";
import type { Model } from "mongoose";
import type { IGroup, IGroupMember, IGroupMethods } from "@/types/models/group";
import { GROUP_LANGUAGES } from "@/types/models/group";
import { addPointsToMember } from "@/lib/services/group";
import { generateInviteCode } from "@/lib/services/group/inviteCode";

const memberSchema = new mongoose.Schema<IGroupMember>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String },
    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastPointDate: { type: Date, default: null },
    joinedAt: { type: Date, default: Date.now },
    lastSeenAt: {
        question: { type: Date, default: null },
        rally: { type: Date, default: null },
        jukebox: { type: Date, default: null },
    },
});

const groupSchema = new mongoose.Schema<
    IGroup,
    Model<IGroup, object, IGroupMethods>,
    IGroupMethods
>({
    name: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // `sparse` so groups created before invite codes existed (no value) don't collide on the unique index.
    inviteCode: { type: String, unique: true, sparse: true },
    language: {
        type: String,
        enum: GROUP_LANGUAGES,
        default: "de",
        required: true,
    },
    members: [memberSchema],
    features: {
        questions: {
            enabled: { type: Boolean, default: true },
            settings: {
                questionCount: { type: Number, default: 1 },
                lastQuestionDate: { type: Date, default: null },
                packs: { type: [String], default: [] },
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

groupSchema.methods.addPoints = async function (userId: string, points: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await addPointsToMember(this as any, userId, points);
};

groupSchema.index({ name: 1 });

// Ensure every group has a shareable invite code on save (new groups, and any
// legacy doc that gets re-saved). A hook rather than a schema `default` because a
// random default is re-applied on every hydration of a doc missing the field —
// producing a different, unpersisted code each load.
groupSchema.pre("save", function () {
    if (!this.inviteCode) this.inviteCode = generateInviteCode();
});

type GroupModel = Model<IGroup, object, IGroupMethods>;

const Group: GroupModel =
    (mongoose.models.Group as GroupModel) ||
    mongoose.model<IGroup, GroupModel>("Group", groupSchema);

export default Group;
