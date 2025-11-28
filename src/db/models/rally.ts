import { IRally } from "@/types/models/rally";
import mongoose from "mongoose";

const pictureSubmissionSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    username: {type: String},
    imageUrl: {type: String, required: true},
    votes: [
        {
            user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
            time: {type: Date},
        },
    ],
});

const rallySchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    task: {type: String, required: true},
    submissions: [pictureSubmissionSchema],
    startTime: {type: Date, required: false},
    endTime: {type: Date, required: false},
    votingOpen: {type: Boolean, default: false},
    resultsShowing: {type: Boolean, default: false},
    used: {type: Boolean, default: false},
    active: {type: Boolean, default: false},
    lengthInDays: {type: Number, required: true},
    submittedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    chat: {type: mongoose.Schema.Types.ObjectId, ref: "Chat"},
    createdAt: {type: Date, default: Date.now},
});

rallySchema.index({groupId: 1});

const Rally = mongoose.models.Rally || mongoose.model<IRally>("Rally", rallySchema);

export default Rally;
