import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser } from "@/test/factories";
import AnnouncementResponse from "@/db/models/AnnouncementResponse";
import User from "@/db/models/User";
import { submitFeedback } from "./feedback";
import type { StaticAnnouncement } from "@/lib/announcements/registry";

const feedbackFixture: StaticAnnouncement[] = [
    {
        kind: "feedback",
        id: "fb-1",
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
            { kind: "thumbs", id: "liked", prompt: "Liked?", optional: true },
            { kind: "text", id: "comment", prompt: "Anything else?", optional: true },
        ],
    },
    {
        kind: "info",
        id: "info-1",
        title: "Info",
        body: "body",
        publishedAt: "2026-04-01",
    },
];

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("submitFeedback", () => {
    it("persists response and marks announcement seen", async () => {
        const user = await makeUser();
        await submitFeedback(
            String(user._id),
            "fb-1",
            { useful: "yes", rating: 5, comment: "great" },
            feedbackFixture
        );

        const doc = await AnnouncementResponse.findOne({
            announcementId: "fb-1",
            userId: user._id,
        });
        expect(doc).not.toBeNull();
        expect(doc?.responses).toEqual({ useful: "yes", rating: 5, comment: "great" });

        const updated = await User.findById(user._id);
        expect(updated?.announcementsSeen).toContain("fb-1");
    });

    it("rejects unknown inputId", async () => {
        const user = await makeUser();
        await expect(
            submitFeedback(
                String(user._id),
                "fb-1",
                { useful: "yes", rating: 5, bogus: "x" },
                feedbackFixture
            )
        ).rejects.toThrow(/Unknown input/);
    });

    it("rejects wrong type for stars", async () => {
        const user = await makeUser();
        await expect(
            submitFeedback(
                String(user._id),
                "fb-1",
                { useful: "yes", rating: "five" as unknown as number },
                feedbackFixture
            )
        ).rejects.toThrow(/integer 1-5/);
    });

    it("rejects missing required input", async () => {
        const user = await makeUser();
        await expect(
            submitFeedback(String(user._id), "fb-1", { useful: "yes" }, feedbackFixture)
        ).rejects.toThrow(/Missing response/);
    });

    it("rejects invalid choice value", async () => {
        const user = await makeUser();
        await expect(
            submitFeedback(
                String(user._id),
                "fb-1",
                { useful: "maybe", rating: 3 },
                feedbackFixture
            )
        ).rejects.toThrow(/Invalid choice/);
    });

    it("upserts on resubmit", async () => {
        const user = await makeUser();
        await submitFeedback(
            String(user._id),
            "fb-1",
            { useful: "yes", rating: 5 },
            feedbackFixture
        );
        await submitFeedback(
            String(user._id),
            "fb-1",
            { useful: "no", rating: 2 },
            feedbackFixture
        );

        const docs = await AnnouncementResponse.find({
            announcementId: "fb-1",
            userId: user._id,
        });
        expect(docs).toHaveLength(1);
        expect(docs[0].responses).toEqual({ useful: "no", rating: 2 });
    });

    it("rejects non-feedback announcement", async () => {
        const user = await makeUser();
        await expect(
            submitFeedback(String(user._id), "info-1", { anything: "x" }, feedbackFixture)
        ).rejects.toThrow(/not found/i);
    });

    it("rejects unknown announcement", async () => {
        const user = await makeUser();
        await expect(
            submitFeedback(String(user._id), "missing", {}, feedbackFixture)
        ).rejects.toThrow(/not found/i);
    });

    it("drops empty optional text and omits from persisted response", async () => {
        const user = await makeUser();
        await submitFeedback(
            String(user._id),
            "fb-1",
            { useful: "yes", rating: 4, comment: "   " },
            feedbackFixture
        );
        const doc = await AnnouncementResponse.findOne({
            announcementId: "fb-1",
            userId: user._id,
        });
        expect(doc?.responses).toEqual({ useful: "yes", rating: 4 });
    });
});
