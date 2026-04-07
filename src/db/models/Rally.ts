import mongoose from "mongoose";
import type { IRally, IPictureSubmission } from "@/types/models/rally";
import { RallyStatus } from "@/types/models/rally";

const pictureSubmissionSchema = new mongoose.Schema<IPictureSubmission>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String },
    imageKey: { type: String, required: true },
    votes: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            time: { type: Date },
        },
    ],
});

const rallySchema = new mongoose.Schema<IRally>(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
        },
        task: { type: String, required: true },
        status: {
            type: String,
            enum: Object.values(RallyStatus),
            default: RallyStatus.Created,
            required: true,
        },
        submissions: [pictureSubmissionSchema],
        startTime: { type: Date, default: null },
        submissionEnd: { type: Date, default: null },
        votingEnd: { type: Date, default: null },
        resultsEnd: { type: Date, default: null },
        lengthInDays: { type: Number, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    },
    { timestamps: true }
);

rallySchema.index({ groupId: 1, status: 1 });

const Rally =
    (mongoose.models.Rally as mongoose.Model<IRally>) ||
    mongoose.model<IRally>("Rally", rallySchema);

export default Rally;
