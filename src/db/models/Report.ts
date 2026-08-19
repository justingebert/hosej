import mongoose from "mongoose";
import { ReportStatus, ReportTargetType } from "@/types/models/report";
import type { IReport } from "@/types/models/report";

const reportSchema = new mongoose.Schema<IReport>({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        default: null,
    },
    targetType: {
        type: String,
        required: true,
        enum: Object.values(ReportTargetType),
    },
    targetId: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        maxlength: 2000,
    },
    status: {
        type: String,
        enum: Object.values(ReportStatus),
        default: ReportStatus.Open,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// The triage query: who is getting reported, and how often.
reportSchema.index({ reportedUser: 1, createdAt: -1 });
// Open reports first, newest first.
reportSchema.index({ status: 1, createdAt: -1 });
// One report per reporter per thing — re-reporting is a silent no-op, not noise.
reportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });

const Report =
    (mongoose.models.Report as mongoose.Model<IReport>) ||
    mongoose.model<IReport>("Report", reportSchema);

export default Report;
