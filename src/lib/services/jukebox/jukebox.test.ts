import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

vi.mock("@/lib/integrations/push", () => import("@/test/fakes/push"));

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser, makeGroup, makeJukebox } from "@/test/factories";
import {
    addSong,
    rateSong,
    activateJukeboxes,
    deactivateGroupJukeboxes,
    createGroupJukebox,
} from "./jukebox";
import Jukebox from "@/db/models/Jukebox";
import Chat from "@/db/models/Chat";
import { getPushCalls, resetPushFake } from "@/test/fakes/push";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import type { IGroup } from "@/types/models/group";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(async () => {
    await clearCollections();
    resetPushFake();
    vi.clearAllMocks();
});

describe("addSong", () => {
    it("adds a song to an active jukebox", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u" }],
        });
        const jukebox = await makeJukebox({ groupId: group._id, active: true });

        const result = await addSong(
            jukebox._id.toString(),
            group._id.toString(),
            user._id.toString(),
            {
                spotifyTrackId: "track-1",
                title: "Test Song",
                artist: "Test Artist",
                album: "Test Album",
                coverImageUrl: "https://example.com/cover.jpg",
            }
        );

        expect(result.songs).toHaveLength(1);
        expect(result.songs[0].spotifyTrackId).toBe("track-1");
        expect(result.songs[0].submittedBy.toString()).toBe(user._id.toString());

        const reloaded = await Jukebox.findById(jukebox._id);
        expect(reloaded?.songs).toHaveLength(1);
    });

    it("throws ValidationError when required fields are missing", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const jukebox = await makeJukebox({ groupId: group._id, active: true });

        await expect(
            addSong(jukebox._id.toString(), group._id.toString(), user._id.toString(), {
                spotifyTrackId: "",
                title: "Test",
                artist: "Artist",
            })
        ).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when jukebox not found", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });

        await expect(
            addSong(new Types.ObjectId().toString(), group._id.toString(), user._id.toString(), {
                spotifyTrackId: "track-1",
                title: "Test Song",
                artist: "Test Artist",
            })
        ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when jukebox is inactive", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const jukebox = await makeJukebox({ groupId: group._id, active: false });

        await expect(
            addSong(jukebox._id.toString(), group._id.toString(), user._id.toString(), {
                spotifyTrackId: "track-1",
                title: "Test Song",
                artist: "Test Artist",
            })
        ).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError when user already submitted a song", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const jukebox = await makeJukebox({
            groupId: group._id,
            active: true,
            songs: [
                {
                    spotifyTrackId: "existing",
                    title: "Existing",
                    artist: "A",
                    submittedBy: user._id,
                    ratings: [],
                },
            ],
        });

        await expect(
            addSong(jukebox._id.toString(), group._id.toString(), user._id.toString(), {
                spotifyTrackId: "track-2",
                title: "Another Song",
                artist: "Artist",
            })
        ).rejects.toThrow(ConflictError);
    });
});

describe("rateSong", () => {
    async function setupJukeboxWithSong(
        submitterId: Types.ObjectId,
        groupAdmin?: Types.ObjectId,
        existingRatings: Array<{ userId: Types.ObjectId; rating: number }> = []
    ) {
        const admin = groupAdmin ?? (await makeUser())._id;
        const group = await makeGroup({ admin, members: [{ user: admin, name: "a" }] });
        const jukebox = await makeJukebox({
            groupId: group._id,
            active: true,
            songs: [
                {
                    spotifyTrackId: "t",
                    title: "Song",
                    artist: "Artist",
                    submittedBy: submitterId,
                    ratings: existingRatings,
                },
            ],
        });
        return { group, jukebox, songId: jukebox.songs[0]._id as Types.ObjectId };
    }

    it("adds a rating to a song", async () => {
        const submitter = await makeUser();
        const rater = await makeUser();
        const { jukebox, songId } = await setupJukeboxWithSong(submitter._id);

        const result = await rateSong(
            jukebox._id.toString(),
            songId.toString(),
            rater._id.toString(),
            75
        );

        expect(result.ratings).toHaveLength(1);
        expect(result.ratings[0].rating).toBe(75);

        const reloaded = await Jukebox.findById(jukebox._id);
        expect(reloaded?.songs[0].ratings).toHaveLength(1);
        expect(reloaded?.songs[0].ratings[0].rating).toBe(75);
    });

    it("throws ValidationError for rating below 1", async () => {
        const submitter = await makeUser();
        const rater = await makeUser();
        const { jukebox, songId } = await setupJukeboxWithSong(submitter._id);

        await expect(
            rateSong(jukebox._id.toString(), songId.toString(), rater._id.toString(), 0)
        ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError for rating above 100", async () => {
        const submitter = await makeUser();
        const rater = await makeUser();
        const { jukebox, songId } = await setupJukeboxWithSong(submitter._id);

        await expect(
            rateSong(jukebox._id.toString(), songId.toString(), rater._id.toString(), 101)
        ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError for non-number rating", async () => {
        const submitter = await makeUser();
        const rater = await makeUser();
        const { jukebox, songId } = await setupJukeboxWithSong(submitter._id);

        await expect(
            rateSong(
                jukebox._id.toString(),
                songId.toString(),
                rater._id.toString(),
                "abc" as unknown as number
            )
        ).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when jukebox not found", async () => {
        const rater = await makeUser();

        await expect(
            rateSong(
                new Types.ObjectId().toString(),
                new Types.ObjectId().toString(),
                rater._id.toString(),
                50
            )
        ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when song not found", async () => {
        const rater = await makeUser();
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });
        const jukebox = await makeJukebox({ groupId: group._id, active: true, songs: [] });

        await expect(
            rateSong(
                jukebox._id.toString(),
                new Types.ObjectId().toString(),
                rater._id.toString(),
                50
            )
        ).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError when rating own song", async () => {
        const submitter = await makeUser();
        const { jukebox, songId } = await setupJukeboxWithSong(submitter._id);

        await expect(
            rateSong(jukebox._id.toString(), songId.toString(), submitter._id.toString(), 50)
        ).rejects.toThrow(ConflictError);
    });

    it("throws ConflictError when user already rated", async () => {
        const submitter = await makeUser();
        const rater = await makeUser();
        const { jukebox, songId } = await setupJukeboxWithSong(submitter._id, undefined, [
            { userId: rater._id, rating: 60 },
        ]);

        await expect(
            rateSong(jukebox._id.toString(), songId.toString(), rater._id.toString(), 50)
        ).rejects.toThrow(ConflictError);
    });
});

describe("activateJukeboxes", () => {
    const today = new Date();

    async function makeJukeboxGroup(activationDays: number[], concurrent: string[]) {
        const admin = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [{ user: admin._id, name: "a" }],
        });
        group.features.jukebox.enabled = true;
        group.features.jukebox.settings.activationDays = activationDays;
        group.features.jukebox.settings.concurrent = concurrent;
        await group.save();
        return group;
    }

    it("skips activation when today is not an activation day", async () => {
        const notToday = today.getDate() === 1 ? 15 : 1;
        const group = await makeJukeboxGroup([notToday], ["Theme A"]);

        await activateJukeboxes(group as unknown as IGroup);

        expect(await Jukebox.countDocuments({ groupId: group._id })).toBe(0);
        expect(getPushCalls()).toHaveLength(0);
    });

    it("deactivates old and creates new jukeboxes on activation day", async () => {
        const group = await makeJukeboxGroup([today.getDate()], ["Rock", "Pop"]);
        await makeJukebox({ groupId: group._id, active: true, title: "Old" });

        await activateJukeboxes(group as unknown as IGroup);

        const active = await Jukebox.find({ groupId: group._id, active: true });
        expect(active).toHaveLength(2);
        expect(active.map((j) => j.title).sort()).toEqual(["Pop", "Rock"]);

        const deactivated = await Jukebox.find({ groupId: group._id, active: false });
        expect(deactivated).toHaveLength(1);
        expect(deactivated[0].title).toBe("Old");

        const pushes = getPushCalls();
        expect(pushes).toHaveLength(1);
        const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(today);
        expect(pushes[0].title).toContain(monthName);
    });

    it("activates on last day of month when 0 is in activationDays", async () => {
        vi.useFakeTimers();
        try {
            vi.setSystemTime(new Date("2026-02-28T12:00:00Z"));
            const group = await makeJukeboxGroup([0], ["Theme A"]);

            await activateJukeboxes(group as unknown as IGroup);

            const active = await Jukebox.find({ groupId: group._id, active: true });
            expect(active).toHaveLength(1);
            expect(active[0].title).toBe("Theme A");
            expect(getPushCalls()).toHaveLength(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it("skips activation on non-last day when only 0 is set", async () => {
        vi.useFakeTimers();
        try {
            vi.setSystemTime(new Date("2026-02-15T12:00:00Z"));
            const group = await makeJukeboxGroup([0], ["Theme A"]);

            await activateJukeboxes(group as unknown as IGroup);

            expect(await Jukebox.countDocuments({ groupId: group._id })).toBe(0);
            expect(getPushCalls()).toHaveLength(0);
        } finally {
            vi.useRealTimers();
        }
    });
});

describe("createGroupJukebox", () => {
    it("creates jukebox and associated chat", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });

        await createGroupJukebox(group._id, "My Theme");

        const jukebox = await Jukebox.findOne({ groupId: group._id, title: "My Theme" });
        expect(jukebox).not.toBeNull();
        expect(jukebox?.active).toBe(true);
        expect(jukebox?.chat).toBeTruthy();

        const chat = await Chat.findById(jukebox?.chat);
        expect(chat?.entityModel).toBe("Jukebox");
        expect(chat?.entity.toString()).toBe(jukebox?._id.toString());
    });
});

describe("deactivateGroupJukeboxes", () => {
    it("deactivates all active jukeboxes for a group", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });
        await makeJukebox({ groupId: group._id, active: true });
        await makeJukebox({ groupId: group._id, active: true });

        await deactivateGroupJukeboxes(group._id.toString());

        const active = await Jukebox.find({ groupId: group._id, active: true });
        expect(active).toHaveLength(0);
        const inactive = await Jukebox.find({ groupId: group._id, active: false });
        expect(inactive).toHaveLength(2);
    });

    it("does not touch other groups' jukeboxes", async () => {
        const admin = await makeUser();
        const groupA = await makeGroup({ admin: admin._id });
        const groupB = await makeGroup({ admin: admin._id });
        await makeJukebox({ groupId: groupA._id, active: true });
        const bJukebox = await makeJukebox({ groupId: groupB._id, active: true });

        await deactivateGroupJukeboxes(groupA._id.toString());

        const reloaded = await Jukebox.findById(bJukebox._id);
        expect(reloaded?.active).toBe(true);
    });
});
