import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser, makeGroup } from "@/test/factories";
import Group from "@/db/models/Group";
import { NotFoundError } from "@/lib/api/errorHandling";
import { generateInviteCode } from "./inviteCode";
import {
    getOrCreateInviteCode,
    resetInviteCode,
    getInvitePreviewByCode,
    joinGroupByCode,
} from "./invite";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("generateInviteCode", () => {
    it("produces 8-char codes without ambiguous characters", () => {
        for (let i = 0; i < 50; i++) {
            const code = generateInviteCode();
            expect(code).toHaveLength(8);
            expect(code).not.toMatch(/[0OIl]/);
        }
    });

    it("is effectively unique across many draws", () => {
        const codes = new Set(Array.from({ length: 1000 }, generateInviteCode));
        expect(codes.size).toBe(1000);
    });
});

describe("getOrCreateInviteCode", () => {
    it("returns the existing code when the group already has one", async () => {
        const group = await makeGroup();
        const existing = group.inviteCode;
        expect(existing).toBeTruthy();

        const code = await getOrCreateInviteCode(group);
        expect(code).toBe(existing);
    });

    it("lazily generates + persists a code for a legacy group without one", async () => {
        const group = await makeGroup();
        // Simulate a group created before invite codes existed.
        await Group.updateOne({ _id: group._id }, { $unset: { inviteCode: "" } });
        const legacy = await Group.findById(group._id);
        expect(legacy!.inviteCode).toBeUndefined();

        const code = await getOrCreateInviteCode(legacy!);
        expect(code).toHaveLength(8);

        const reloaded = await Group.findById(group._id);
        expect(reloaded!.inviteCode).toBe(code);
    });
});

describe("resetInviteCode", () => {
    it("replaces the code and persists it, invalidating the old one", async () => {
        const group = await makeGroup();
        const old = group.inviteCode!;

        const next = await resetInviteCode(group);
        expect(next).not.toBe(old);

        const reloaded = await Group.findById(group._id);
        expect(reloaded!.inviteCode).toBe(next);
        await expect(getInvitePreviewByCode(old)).rejects.toThrow(NotFoundError);
    });
});

describe("getInvitePreviewByCode", () => {
    it("returns the group name and member count, never the groupId", async () => {
        const admin = await makeUser();
        const group = await makeGroup({
            name: "Team Rocket",
            admin: admin._id,
            members: [{ user: admin._id, name: "a" }],
        });

        const preview = await getInvitePreviewByCode(group.inviteCode!);
        expect(preview).toEqual({ name: "Team Rocket", memberCount: 1 });
    });

    it("throws NotFoundError for an unknown code", async () => {
        await expect(getInvitePreviewByCode("notacode")).rejects.toThrow(NotFoundError);
    });
});

describe("joinGroupByCode", () => {
    it("adds a non-member to the group", async () => {
        const admin = await makeUser();
        const newbie = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [{ user: admin._id, name: "a" }],
        });

        const result = await joinGroupByCode(newbie._id.toString(), group.inviteCode!);
        expect(result.members).toHaveLength(2);

        const reloaded = await Group.findById(group._id);
        expect(reloaded!.members.some((m) => m.user.toString() === newbie._id.toString())).toBe(
            true
        );
    });

    it("is idempotent — an existing member rejoining does not error or duplicate", async () => {
        const admin = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [{ user: admin._id, name: "a" }],
        });

        const result = await joinGroupByCode(admin._id.toString(), group.inviteCode!);
        expect(result.members).toHaveLength(1);
    });

    it("throws NotFoundError for an unknown code", async () => {
        const user = await makeUser();
        await expect(
            joinGroupByCode(user._id.toString(), new Types.ObjectId().toString())
        ).rejects.toThrow(NotFoundError);
    });
});
