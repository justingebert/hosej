import type { HydratedDocument, Types } from "mongoose";
import type { ToDTO } from "@/types/common";

/** What kind of thing was reported. Mirrors the surfaces that render other people's content. */
export enum ReportTargetType {
    Message = "message",
    RallySubmission = "rallySubmission",
    User = "user",
}

export enum ReportStatus {
    Open = "open",
    Reviewed = "reviewed",
}

export interface IReport {
    _id: Types.ObjectId;
    reporter: Types.ObjectId;
    /** Who the reporter says posted it. Client-supplied — see createReport. */
    reportedUser: Types.ObjectId | null;
    group: Types.ObjectId | null;
    targetType: ReportTargetType;
    /**
     * Stable-enough locator for the reported thing, so one reporter can't file the
     * same report twice: a submission id, a member id, or `chatId:messageCreatedAt`
     * (chat messages are subdocuments the API never exposes an id for).
     */
    targetId: string;
    /** Snapshot of the content at report time — the original may be edited or deleted. */
    content?: string;
    status: ReportStatus;
    createdAt: Date;
}

export type ReportDocument = HydratedDocument<IReport>;

export type ReportDTO = ToDTO<IReport>;
