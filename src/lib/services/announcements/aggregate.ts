import type { Types } from "mongoose";
import AnnouncementResponse from "@/db/models/AnnouncementResponse";
import User from "@/db/models/User";
import type { FeedbackInput, StaticAnnouncement } from "@/lib/announcements/registry";
import { STATIC_ANNOUNCEMENTS } from "@/lib/announcements/registry";

type ChoiceAggregate = { id: string; kind: "choice"; counts: Record<string, number> };
type ThumbsAggregate = { id: string; kind: "thumbs"; up: number; down: number };
type StarsAggregate = {
    id: string;
    kind: "stars";
    average: number;
    counts: Record<1 | 2 | 3 | 4 | 5, number>;
};
type TextAggregate = {
    id: string;
    kind: "text";
    comments: { username: string; text: string; at: Date }[];
};

export type InputAggregate = ChoiceAggregate | ThumbsAggregate | StarsAggregate | TextAggregate;

export type AnnouncementAggregate = {
    id: string;
    title: string;
    kind: StaticAnnouncement["kind"];
    seenCount: number;
    responseCount: number;
    inputs: InputAggregate[];
};

async function aggregateInput(
    announcementId: string,
    input: FeedbackInput
): Promise<InputAggregate> {
    if (input.kind === "choice") {
        const rows = await AnnouncementResponse.aggregate<{ _id: string; count: number }>([
            { $match: { announcementId } },
            { $project: { value: `$responses.${input.id}` } },
            { $match: { value: { $exists: true, $ne: null } } },
            { $group: { _id: "$value", count: { $sum: 1 } } },
        ]);
        const counts: Record<string, number> = {};
        for (const opt of input.options) counts[opt.value] = 0;
        for (const row of rows) {
            if (typeof row._id === "string") counts[row._id] = row.count;
        }
        return { id: input.id, kind: "choice", counts };
    }

    if (input.kind === "thumbs") {
        const rows = await AnnouncementResponse.aggregate<{ _id: boolean; count: number }>([
            { $match: { announcementId } },
            { $project: { value: `$responses.${input.id}` } },
            { $match: { value: { $type: "bool" } } },
            { $group: { _id: "$value", count: { $sum: 1 } } },
        ]);
        let up = 0;
        let down = 0;
        for (const row of rows) {
            if (row._id === true) up = row.count;
            else if (row._id === false) down = row.count;
        }
        return { id: input.id, kind: "thumbs", up, down };
    }

    if (input.kind === "stars") {
        const rows = await AnnouncementResponse.aggregate<{ _id: number; count: number }>([
            { $match: { announcementId } },
            { $project: { value: `$responses.${input.id}` } },
            { $match: { value: { $type: "number" } } },
            { $group: { _id: "$value", count: { $sum: 1 } } },
        ]);
        const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let total = 0;
        let sum = 0;
        for (const row of rows) {
            const key = row._id as 1 | 2 | 3 | 4 | 5;
            if (key >= 1 && key <= 5) {
                counts[key] = row.count;
                total += row.count;
                sum += key * row.count;
            }
        }
        const average = total === 0 ? 0 : sum / total;
        return { id: input.id, kind: "stars", average, counts };
    }

    const docs = await AnnouncementResponse.find({
        announcementId,
        [`responses.${input.id}`]: { $exists: true, $ne: "" },
    })
        .populate<{ userId: { _id: Types.ObjectId; username: string } }>("userId", "username")
        .sort({ createdAt: -1 })
        .lean();

    const comments = docs
        .map((doc) => {
            const value = (doc.responses as Record<string, unknown>)[input.id];
            if (typeof value !== "string" || !value.trim()) return null;
            return {
                username: doc.userId?.username ?? "Unknown",
                text: value,
                at: doc.createdAt,
            };
        })
        .filter((c): c is { username: string; text: string; at: Date } => c !== null);

    return { id: input.id, kind: "text", comments };
}

export async function aggregateAnnouncement(
    announcement: StaticAnnouncement
): Promise<AnnouncementAggregate> {
    const seenCount = await User.countDocuments({ announcementsSeen: announcement.id });
    const responseCount =
        announcement.kind === "feedback"
            ? await AnnouncementResponse.countDocuments({ announcementId: announcement.id })
            : 0;

    const inputs: InputAggregate[] =
        announcement.kind === "feedback"
            ? await Promise.all(
                  announcement.inputs.map((input) => aggregateInput(announcement.id, input))
              )
            : [];

    return {
        id: announcement.id,
        title: announcement.title,
        kind: announcement.kind,
        seenCount,
        responseCount,
        inputs,
    };
}

export async function aggregateAllAnnouncements(
    registry: readonly StaticAnnouncement[] = STATIC_ANNOUNCEMENTS
): Promise<AnnouncementAggregate[]> {
    return Promise.all(registry.map((a) => aggregateAnnouncement(a)));
}
