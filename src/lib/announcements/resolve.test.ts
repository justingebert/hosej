import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser } from "@/test/factories";
import { resolveNextAnnouncement } from "./resolve";
import type { StaticAnnouncement } from "./registry";

const DAY_MS = 24 * 60 * 60 * 1000;

const fixture: StaticAnnouncement[] = [
    { kind: "info", id: "a-2026-01", title: "A", body: "body a", publishedAt: "2026-01-01" },
    { kind: "info", id: "a-2026-02", title: "B", body: "body b", publishedAt: "2026-02-01" },
];

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("resolveNextAnnouncement", () => {
    it("returns null when nothing pending", async () => {
        const user = await makeUser({ googleConnected: true });
        expect(resolveNextAnnouncement(user.toObject(), [])).toBeNull();
    });

    it("returns first unseen static announcement", async () => {
        const user = await makeUser({
            googleConnected: true,
            announcementsSeen: ["a-2026-01"],
        });
        expect(resolveNextAnnouncement(user.toObject(), fixture)?.id).toBe("a-2026-02");
    });

    it("prioritizes google nudge over static announcement", async () => {
        const user = await makeUser({
            createdAt: new Date(Date.now() - 10 * DAY_MS),
        });
        expect(resolveNextAnnouncement(user.toObject(), fixture)?.id).toBe("nudge:google-connect");
    });

    it("suppresses nudge once seen, falls back to static", async () => {
        const user = await makeUser({
            createdAt: new Date(Date.now() - 10 * DAY_MS),
            announcementsSeen: ["nudge:google-connect"],
        });
        expect(resolveNextAnnouncement(user.toObject(), fixture)?.id).toBe("a-2026-01");
    });

    it("suppresses nudge when googleConnected is true", async () => {
        const user = await makeUser({
            googleConnected: true,
            createdAt: new Date(Date.now() - 10 * DAY_MS),
        });
        expect(resolveNextAnnouncement(user.toObject(), [])).toBeNull();
    });

    it("suppresses nudge when user is <3 days old", async () => {
        const user = await makeUser({
            createdAt: new Date(Date.now() - 2 * DAY_MS),
        });
        expect(resolveNextAnnouncement(user.toObject(), [])).toBeNull();
    });

    it("returns null when all static announcements seen and no nudge", async () => {
        const user = await makeUser({
            googleConnected: true,
            announcementsSeen: ["a-2026-01", "a-2026-02"],
        });
        expect(resolveNextAnnouncement(user.toObject(), fixture)).toBeNull();
    });
});

describe("resolveNextAnnouncement (persisted user)", () => {
    it("resolves nudge for a persisted user older than 3 days without Google", async () => {
        const user = await makeUser({
            googleConnected: false,
            createdAt: new Date(Date.now() - 5 * DAY_MS),
        });

        const result = resolveNextAnnouncement(user.toObject(), []);
        expect(result?.id).toBe("nudge:google-connect");
        expect(result?.cta?.href).toBe("/settings");
    });

    it("respects announcementsSeen persisted on the user doc", async () => {
        const user = await makeUser({
            googleConnected: true,
            announcementsSeen: ["a-2026-01"],
        });

        const result = resolveNextAnnouncement(user.toObject(), fixture);
        expect(result?.id).toBe("a-2026-02");
    });
});
