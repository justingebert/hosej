import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser } from "@/test/factories";
import AnnouncementResponse from "@/db/models/AnnouncementResponse";
import User from "@/db/models/User";
import { aggregateAnnouncement } from "./aggregate";
import type { FeedbackAnnouncement, StaticAnnouncement } from "@/lib/announcements/registry";

const feedbackAnnouncement: FeedbackAnnouncement = {
    kind: "feedback",
    id: "fb-agg",
    title: "How was it?",
    body: "Tell us",
    publishedAt: "2026-04-01",
    inputs: [
        {
            kind: "choice",
            id: "useful",
            prompt: "Useful?",
            options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
            ],
        },
        { kind: "stars", id: "rating", prompt: "Rating" },
        { kind: "thumbs", id: "liked", prompt: "Liked?" },
        { kind: "text", id: "comment", prompt: "Comment" },
    ],
};

const infoAnnouncement: StaticAnnouncement = {
    kind: "info",
    id: "info-agg",
    title: "Info",
    body: "body",
    publishedAt: "2026-04-01",
};

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("aggregateAnnouncement - feedback", () => {
    it("aggregates responses across users", async () => {
        const alice = await makeUser({ username: "alice", announcementsSeen: ["fb-agg"] });
        const bob = await makeUser({ username: "bob", announcementsSeen: ["fb-agg"] });
        const carol = await makeUser({ username: "carol", announcementsSeen: ["fb-agg"] });

        await AnnouncementResponse.create({
            announcementId: "fb-agg",
            userId: alice._id,
            responses: { useful: "yes", rating: 5, liked: true, comment: "love it" },
        });
        await AnnouncementResponse.create({
            announcementId: "fb-agg",
            userId: bob._id,
            responses: { useful: "yes", rating: 3, liked: false, comment: "meh" },
        });
        await AnnouncementResponse.create({
            announcementId: "fb-agg",
            userId: carol._id,
            responses: { useful: "no", rating: 1, liked: false },
        });

        const result = await aggregateAnnouncement(feedbackAnnouncement);

        expect(result.id).toBe("fb-agg");
        expect(result.kind).toBe("feedback");
        expect(result.seenCount).toBe(3);
        expect(result.responseCount).toBe(3);

        const choice = result.inputs.find((i) => i.id === "useful");
        expect(choice).toEqual({
            id: "useful",
            kind: "choice",
            counts: { yes: 2, no: 1 },
        });

        const stars = result.inputs.find((i) => i.id === "rating");
        if (stars?.kind !== "stars") throw new Error("stars missing");
        expect(stars.average).toBe((5 + 3 + 1) / 3);
        expect(stars.counts).toEqual({ 1: 1, 2: 0, 3: 1, 4: 0, 5: 1 });

        const thumbs = result.inputs.find((i) => i.id === "liked");
        expect(thumbs).toEqual({ id: "liked", kind: "thumbs", up: 1, down: 2 });

        const text = result.inputs.find((i) => i.id === "comment");
        if (text?.kind !== "text") throw new Error("text missing");
        expect(text.comments).toHaveLength(2);
        const names = text.comments.map((c) => c.username).sort();
        expect(names).toEqual(["alice", "bob"]);
        const textsByUser = Object.fromEntries(text.comments.map((c) => [c.username, c.text]));
        expect(textsByUser.alice).toBe("love it");
        expect(textsByUser.bob).toBe("meh");
    });

    it("returns zero counts when no responses exist", async () => {
        const result = await aggregateAnnouncement(feedbackAnnouncement);
        expect(result.seenCount).toBe(0);
        expect(result.responseCount).toBe(0);
        const stars = result.inputs.find((i) => i.id === "rating");
        if (stars?.kind !== "stars") throw new Error("stars missing");
        expect(stars.average).toBe(0);
    });

    it("counts seen users separately from responses", async () => {
        await makeUser({ announcementsSeen: ["fb-agg"] });
        await makeUser({ announcementsSeen: ["fb-agg"] });
        const responder = await makeUser({ announcementsSeen: ["fb-agg"] });
        await AnnouncementResponse.create({
            announcementId: "fb-agg",
            userId: responder._id,
            responses: { useful: "yes", rating: 4, liked: true },
        });

        const result = await aggregateAnnouncement(feedbackAnnouncement);
        expect(result.seenCount).toBe(3);
        expect(result.responseCount).toBe(1);
    });
});

describe("aggregateAnnouncement - info", () => {
    it("reports seen count only, with no inputs", async () => {
        const u1 = await makeUser({ announcementsSeen: ["info-agg"] });
        await makeUser({ announcementsSeen: ["info-agg"] });
        await makeUser();

        expect(await User.countDocuments({})).toBe(3);

        const result = await aggregateAnnouncement(infoAnnouncement);
        expect(result.seenCount).toBe(2);
        expect(result.responseCount).toBe(0);
        expect(result.inputs).toEqual([]);
        expect(u1).toBeDefined();
    });
});
