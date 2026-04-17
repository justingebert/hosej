import AnnouncementResponse from "@/db/models/AnnouncementResponse";
import User from "@/db/models/User";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import type {
    FeedbackAnnouncement,
    FeedbackInput,
    StaticAnnouncement,
} from "@/lib/announcements/registry";
import { STATIC_ANNOUNCEMENTS } from "@/lib/announcements/registry";
import type { AnnouncementResponseValue } from "@/types/models/announcementResponse";

function findFeedbackAnnouncement(
    announcementId: string,
    registry: readonly StaticAnnouncement[]
): FeedbackAnnouncement {
    const announcement = registry.find((a) => a.id === announcementId);
    if (!announcement || announcement.kind !== "feedback") {
        throw new NotFoundError("Feedback announcement not found");
    }
    return announcement;
}

function validateResponse(
    input: FeedbackInput,
    value: AnnouncementResponseValue | undefined
): AnnouncementResponseValue | undefined {
    if (value === undefined || value === "" || value === null) {
        if (input.optional) return undefined;
        throw new ValidationError(`Missing response for input "${input.id}"`);
    }

    switch (input.kind) {
        case "choice": {
            if (typeof value !== "string") {
                throw new ValidationError(`Input "${input.id}" requires a string value`);
            }
            const allowed = input.options.some((o) => o.value === value);
            if (!allowed) {
                throw new ValidationError(`Invalid choice for input "${input.id}"`);
            }
            return value;
        }
        case "thumbs": {
            if (typeof value !== "boolean") {
                throw new ValidationError(`Input "${input.id}" requires a boolean value`);
            }
            return value;
        }
        case "stars": {
            if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
                throw new ValidationError(`Input "${input.id}" requires an integer 1-5`);
            }
            return value;
        }
        case "text": {
            if (typeof value !== "string") {
                throw new ValidationError(`Input "${input.id}" requires a string value`);
            }
            const trimmed = value.trim();
            if (!trimmed) {
                if (input.optional) return undefined;
                throw new ValidationError(`Missing response for input "${input.id}"`);
            }
            const max = input.maxLength ?? 2000;
            if (trimmed.length > max) {
                throw new ValidationError(
                    `Input "${input.id}" exceeds max length of ${max} characters`
                );
            }
            return trimmed;
        }
    }
}

export async function submitFeedback(
    userId: string,
    announcementId: string,
    responses: Record<string, AnnouncementResponseValue>,
    registry: readonly StaticAnnouncement[] = STATIC_ANNOUNCEMENTS
): Promise<void> {
    const announcement = findFeedbackAnnouncement(announcementId, registry);

    const allowedIds = new Set(announcement.inputs.map((i) => i.id));
    for (const key of Object.keys(responses)) {
        if (!allowedIds.has(key)) {
            throw new ValidationError(`Unknown input "${key}"`);
        }
    }

    const validated: Record<string, AnnouncementResponseValue> = {};
    for (const input of announcement.inputs) {
        const value = validateResponse(input, responses[input.id]);
        if (value !== undefined) {
            validated[input.id] = value;
        }
    }

    await AnnouncementResponse.findOneAndUpdate(
        { announcementId, userId },
        { $set: { responses: validated } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.updateOne({ _id: userId }, { $addToSet: { announcementsSeen: announcementId } });
}
