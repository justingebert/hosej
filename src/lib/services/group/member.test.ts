import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser, makeGroup } from "@/test/factories";
import { getGroupMembers, joinGroup, removeMember, addPointsToMember } from "./member";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/api/errorHandling";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("getGroupMembers", () => {
    it("returns group members", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u" }],
        });

        const result = await getGroupMembers(user._id.toString(), group._id.toString());

        expect(result).toHaveLength(1);
        expect(result[0].user.toString()).toBe(user._id.toString());
    });

    it("throws ForbiddenError when user is not a member", async () => {
        const member = await makeUser();
        const outsider = await makeUser();
        const group = await makeGroup({
            admin: member._id,
            members: [{ user: member._id, name: "m" }],
        });

        await expect(
            getGroupMembers(outsider._id.toString(), group._id.toString())
        ).rejects.toThrow(ForbiddenError);
    });
});

describe("joinGroup", () => {
    it("adds user to group and group to user", async () => {
        const admin = await makeUser();
        const newbie = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [{ user: admin._id, name: "a" }],
        });

        const result = await joinGroup(newbie._id.toString(), group._id.toString());

        const reloaded = await Group.findById(group._id);
        expect(reloaded?.members).toHaveLength(2);
        expect(reloaded?.members.some((m) => m.user.toString() === newbie._id.toString())).toBe(
            true
        );

        const reloadedUser = await User.findById(newbie._id);
        expect(reloadedUser?.groups.map((g) => g.toString()).includes(group._id.toString())).toBe(
            true
        );

        expect(result.username).toBe(newbie.username);
    });

    it("throws ConflictError when user is already a member", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u" }],
        });

        await expect(joinGroup(user._id.toString(), group._id.toString())).rejects.toThrow(
            ConflictError
        );
    });

    it("throws NotFoundError when user not found", async () => {
        const group = await makeGroup();

        await expect(
            joinGroup(new Types.ObjectId().toString(), group._id.toString())
        ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when group not found", async () => {
        const user = await makeUser();

        await expect(
            joinGroup(user._id.toString(), new Types.ObjectId().toString())
        ).rejects.toThrow(NotFoundError);
    });
});

describe("removeMember", () => {
    it("removes member from group", async () => {
        const admin = await makeUser();
        const member = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [
                { user: admin._id, name: "admin" },
                { user: member._id, name: "member" },
            ],
        });
        await User.findByIdAndUpdate(member._id, { $push: { groups: group._id } });

        const result = await removeMember(
            admin._id.toString(),
            group._id.toString(),
            member._id.toString()
        );

        expect(result.deleted).toBe(false);

        const reloaded = await Group.findById(group._id);
        expect(reloaded?.members).toHaveLength(1);
        expect(reloaded?.members.some((m) => m.user.toString() === member._id.toString())).toBe(
            false
        );

        const reloadedMember = await User.findById(member._id);
        expect(reloadedMember?.groups.map((g) => g.toString()).includes(group._id.toString())).toBe(
            false
        );
    });

    it("deletes group when last member leaves", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u" }],
        });

        const result = await removeMember(
            user._id.toString(),
            group._id.toString(),
            user._id.toString()
        );

        expect(result.deleted).toBe(true);
        expect(await Group.findById(group._id)).toBeNull();
    });

    it("throws ForbiddenError when non-admin removes another member", async () => {
        const admin = await makeUser();
        const requester = await makeUser();
        const target = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [
                { user: admin._id, name: "admin" },
                { user: requester._id, name: "req" },
                { user: target._id, name: "tgt" },
            ],
        });

        await expect(
            removeMember(requester._id.toString(), group._id.toString(), target._id.toString())
        ).rejects.toThrow(ForbiddenError);
    });

    it("throws NotFoundError when group not found", async () => {
        const user = await makeUser();

        await expect(
            removeMember(user._id.toString(), new Types.ObjectId().toString(), user._id.toString())
        ).rejects.toThrow(NotFoundError);
    });
});

describe("addPointsToMember", () => {
    it("adds points to member", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u", points: 10 }],
        });

        await addPointsToMember(group, user._id.toString(), 5);

        expect(group.members[0].points).toBe(15);
        const reloaded = await Group.findById(group._id);
        expect(reloaded?.members[0].points).toBe(15);
    });

    it("throws when member is not found in group", async () => {
        const other = await makeUser();
        const group = await makeGroup({
            admin: other._id,
            members: [{ user: other._id, name: "o" }],
        });

        await expect(addPointsToMember(group, new Types.ObjectId().toString(), 5)).rejects.toThrow(
            "Member not found in group"
        );
    });

    it("increments streak if last points were given yesterday", async () => {
        const user = await makeUser();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u", streak: 5, lastPointDate: yesterday }],
        });

        await addPointsToMember(group, user._id.toString(), 1);

        expect(group.members[0].streak).toBe(6);
    });

    it("keeps streak if points already given today", async () => {
        const user = await makeUser();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u", streak: 5, lastPointDate: today }],
        });

        await addPointsToMember(group, user._id.toString(), 1);

        expect(group.members[0].streak).toBe(5);
    });

    it("resets streak to 1 if a day was missed", async () => {
        const user = await makeUser();
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        twoDaysAgo.setHours(0, 0, 0, 0);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u", streak: 5, lastPointDate: twoDaysAgo }],
        });
        group.features.questions.settings.lastQuestionDate = yesterday;

        await addPointsToMember(group, user._id.toString(), 1);

        expect(group.members[0].streak).toBe(1);
    });

    it("continues streak if no questions were available", async () => {
        const user = await makeUser();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        threeDaysAgo.setHours(0, 0, 0, 0);

        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u", streak: 5, lastPointDate: threeDaysAgo }],
        });
        group.features.questions.settings.lastQuestionDate = threeDaysAgo;

        await addPointsToMember(group, user._id.toString(), 1);

        expect(group.members[0].streak).toBe(6);
    });
});
