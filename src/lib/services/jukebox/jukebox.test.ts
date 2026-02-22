import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Types } from "mongoose";

vi.mock("@/db/dbConnect", () => ({ default: vi.fn() }));
vi.mock("@/db/models/Jukebox");
vi.mock("@/db/models/Chat");
vi.mock("@/db/models/User");
vi.mock("@/db/models/Group");
vi.mock("firebase-admin", () => ({
    default: { apps: [], initializeApp: vi.fn(), credential: { cert: vi.fn() } },
}));
vi.mock("@/lib/sendNotification", () => ({
    sendNotification: vi.fn().mockResolvedValue(undefined),
}));

import { addSong, rateSong, activateJukeboxes, deactivateGroupJukeboxes } from "./jukebox";
import Jukebox from "@/db/models/Jukebox";
import Chat from "@/db/models/Chat";
import { sendNotification } from "@/lib/sendNotification";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";

const mockGroupId = new Types.ObjectId().toString();
const mockUserId = new Types.ObjectId().toString();
const mockJukeboxId = new Types.ObjectId().toString();
const mockSongId = new Types.ObjectId().toString();

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── addSong ─────────────────────────────────────────────────

describe("addSong", () => {
    it("should add a song to an active jukebox", async () => {
        const mockJukebox = {
            _id: mockJukeboxId,
            songs: [] as any[],
            save: vi.fn().mockResolvedValue(undefined),
        };
        (Jukebox.findOne as Mock).mockResolvedValue(mockJukebox);

        const result = await addSong(mockJukeboxId, mockGroupId, mockUserId, {
            spotifyTrackId: "track-1",
            title: "Test Song",
            artist: "Test Artist",
            album: "Test Album",
            coverImageUrl: "https://example.com/cover.jpg",
        });

        expect(mockJukebox.songs).toHaveLength(1);
        expect(mockJukebox.songs[0].spotifyTrackId).toBe("track-1");
        expect(mockJukebox.songs[0].submittedBy).toBe(mockUserId);
        expect(mockJukebox.save).toHaveBeenCalled();
        expect(result).toBe(mockJukebox);
    });

    it("should throw ValidationError when required fields are missing", async () => {
        await expect(
            addSong(mockJukeboxId, mockGroupId, mockUserId, {
                spotifyTrackId: "",
                title: "Test",
                artist: "Artist",
            })
        ).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError when jukebox not found", async () => {
        (Jukebox.findOne as Mock).mockResolvedValue(null);

        await expect(
            addSong(mockJukeboxId, mockGroupId, mockUserId, {
                spotifyTrackId: "track-1",
                title: "Test Song",
                artist: "Test Artist",
            })
        ).rejects.toThrow(NotFoundError);
    });

    it("should throw ConflictError when user already submitted a song", async () => {
        const mockJukebox = {
            _id: mockJukeboxId,
            songs: [{ submittedBy: new Types.ObjectId(mockUserId) }],
            save: vi.fn(),
        };
        (Jukebox.findOne as Mock).mockResolvedValue(mockJukebox);

        await expect(
            addSong(mockJukeboxId, mockGroupId, mockUserId, {
                spotifyTrackId: "track-2",
                title: "Another Song",
                artist: "Artist",
            })
        ).rejects.toThrow(ConflictError);
    });
});

// ─── rateSong ────────────────────────────────────────────────

describe("rateSong", () => {
    function createMockJukeboxWithSong(songSubmittedBy: string, existingRatings: any[] = []) {
        return {
            _id: mockJukeboxId,
            songs: [
                {
                    _id: new Types.ObjectId(mockSongId),
                    submittedBy: new Types.ObjectId(songSubmittedBy),
                    ratings: existingRatings,
                },
            ],
            save: vi.fn().mockResolvedValue(undefined),
        };
    }

    const otherUserId = new Types.ObjectId().toString();

    it("should add a rating to a song", async () => {
        const mockJukebox = createMockJukeboxWithSong(otherUserId);
        (Jukebox.findById as Mock).mockResolvedValue(mockJukebox);

        const result = await rateSong(mockJukeboxId, mockSongId, mockUserId, 75);

        expect(mockJukebox.songs[0].ratings).toHaveLength(1);
        expect(mockJukebox.songs[0].ratings[0].rating).toBe(75);
        expect(mockJukebox.save).toHaveBeenCalled();
        expect(result).toBe(mockJukebox.songs[0]);
    });

    it("should throw ValidationError for rating below 1", async () => {
        await expect(rateSong(mockJukeboxId, mockSongId, mockUserId, 0)).rejects.toThrow(
            ValidationError
        );
    });

    it("should throw ValidationError for rating above 100", async () => {
        await expect(rateSong(mockJukeboxId, mockSongId, mockUserId, 101)).rejects.toThrow(
            ValidationError
        );
    });

    it("should throw ValidationError for non-number rating", async () => {
        await expect(rateSong(mockJukeboxId, mockSongId, mockUserId, "abc" as any)).rejects.toThrow(
            ValidationError
        );
    });

    it("should throw NotFoundError when jukebox not found", async () => {
        (Jukebox.findById as Mock).mockResolvedValue(null);

        await expect(rateSong(mockJukeboxId, mockSongId, mockUserId, 50)).rejects.toThrow(
            NotFoundError
        );
    });

    it("should throw NotFoundError when song not found", async () => {
        const mockJukebox = { _id: mockJukeboxId, songs: [], save: vi.fn() };
        (Jukebox.findById as Mock).mockResolvedValue(mockJukebox);

        await expect(rateSong(mockJukeboxId, mockSongId, mockUserId, 50)).rejects.toThrow(
            NotFoundError
        );
    });

    it("should throw ConflictError when rating own song", async () => {
        const mockJukebox = createMockJukeboxWithSong(mockUserId);
        (Jukebox.findById as Mock).mockResolvedValue(mockJukebox);

        await expect(rateSong(mockJukeboxId, mockSongId, mockUserId, 50)).rejects.toThrow(
            ConflictError
        );
    });

    it("should throw ConflictError when user already rated", async () => {
        const mockJukebox = createMockJukeboxWithSong(otherUserId, [
            { userId: new Types.ObjectId(mockUserId), rating: 60 },
        ]);
        (Jukebox.findById as Mock).mockResolvedValue(mockJukebox);

        await expect(rateSong(mockJukeboxId, mockSongId, mockUserId, 50)).rejects.toThrow(
            ConflictError
        );
    });
});

// ─── activateJukeboxes ──────────────────────────────────────

describe("activateJukeboxes", () => {
    const today = new Date();

    function createMockGroup(activationDays: number[], concurrent: string[]) {
        return {
            _id: new Types.ObjectId(mockGroupId),
            features: {
                jukebox: {
                    enabled: true,
                    settings: {
                        activationDays,
                        concurrent,
                    },
                },
            },
        } as any;
    }

    it("should skip activation if today is not an activation day", async () => {
        const group = createMockGroup([99], ["Theme A"]);
        await activateJukeboxes(group);

        expect(Jukebox.updateMany).not.toHaveBeenCalled();
    });

    it("should deactivate old and create new jukeboxes on activation day", async () => {
        const group = createMockGroup([today.getDate()], ["Rock", "Pop"]);

        const mockSavedJukebox = {
            _id: new Types.ObjectId(),
            chat: null,
            save: vi.fn().mockResolvedValue(undefined),
        };
        const mockSavedChat = {
            _id: new Types.ObjectId(),
            save: vi.fn().mockResolvedValue(undefined),
        };

        (Jukebox.updateMany as Mock).mockResolvedValue({});
        vi.mocked(Jukebox).mockImplementation(function (this: any, data: any) {
            Object.assign(this, data, {
                _id: mockSavedJukebox._id,
                save: vi.fn().mockImplementation(async () => {
                    return this;
                }),
            });
            return this;
        } as any);
        vi.mocked(Chat).mockImplementation(function (this: any, data: any) {
            Object.assign(this, data, {
                _id: mockSavedChat._id,
                save: vi.fn().mockResolvedValue(this),
            });
            return this;
        } as any);
        (sendNotification as Mock).mockResolvedValue(undefined);

        await activateJukeboxes(group);

        expect(Jukebox.updateMany).toHaveBeenCalledWith(
            { active: true, groupId: group._id },
            { active: false }
        );
        expect(sendNotification).toHaveBeenCalled();
    });

    it("should send notification with month name", async () => {
        const group = createMockGroup([today.getDate()], ["Theme"]);

        vi.mocked(Jukebox).mockImplementation(function (this: any, data: any) {
            Object.assign(this, data, {
                _id: new Types.ObjectId(),
                save: vi.fn().mockResolvedValue(this),
            });
            return this;
        } as any);
        vi.mocked(Chat).mockImplementation(function (this: any, data: any) {
            Object.assign(this, data, {
                _id: new Types.ObjectId(),
                save: vi.fn().mockResolvedValue(this),
            });
            return this;
        } as any);
        (Jukebox.updateMany as Mock).mockResolvedValue({});
        (sendNotification as Mock).mockResolvedValue(undefined);

        await activateJukeboxes(group);

        const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(today);
        expect(sendNotification).toHaveBeenCalledWith(
            expect.stringContaining(monthName),
            expect.any(String),
            group._id
        );
    });
});

// ─── deactivateGroupJukeboxes ────────────────────────────────

describe("deactivateGroupJukeboxes", () => {
    it("should deactivate all active jukeboxes for a group", async () => {
        (Jukebox.updateMany as Mock).mockResolvedValue({});

        await deactivateGroupJukeboxes(mockGroupId);

        expect(Jukebox.updateMany).toHaveBeenCalledWith(
            { active: true, groupId: mockGroupId },
            { active: false }
        );
    });
});
