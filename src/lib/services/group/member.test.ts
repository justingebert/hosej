import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Types } from "mongoose";

vi.mock("@/db/models/Group");
vi.mock("@/db/models/User");
vi.mock("@/db/dbConnect");
vi.mock("./group");

import { getGroupMembers, joinGroup, removeMember, addPointsToMember } from "./member";
import { isUserInGroup } from "./group";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import dbConnect from "@/db/dbConnect";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/api/errorHandling";

const mockUserId = new Types.ObjectId().toString();
const mockGroupId = new Types.ObjectId().toString();
const mockMemberId = new Types.ObjectId().toString();

function createMockGroup(overrides = {}) {
    return {
        _id: new Types.ObjectId(mockGroupId),
        name: "Test Group",
        admin: new Types.ObjectId(mockUserId),
        members: [
            {
                user: new Types.ObjectId(mockUserId),
                name: "testuser",
                points: 0,
                streak: 0,
                joinedAt: new Date("2024-01-01"),
            },
        ],
        features: {
            questions: { enabled: true, settings: { questionCount: 1, lastQuestionDate: null } },
        },
        save: vi.fn().mockResolvedValue(undefined),
        toObject: vi.fn().mockReturnThis(),
        ...overrides,
    };
}

function createMockUser(overrides = {}) {
    return {
        _id: new Types.ObjectId(mockUserId),
        username: "testuser",
        groups: [],
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    (dbConnect as Mock).mockResolvedValue(undefined);
    (isUserInGroup as Mock).mockResolvedValue({ isAuthorized: true });
});

// ─── getGroupMembers ─────────────────────────────────────────

describe("getGroupMembers", () => {
    it("should return group members", async () => {
        const mockMembers = [{ user: new Types.ObjectId(mockUserId), name: "testuser" }];
        const mockGroup = createMockGroup({ members: mockMembers });
        (Group.findById as Mock).mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockGroup),
        });

        const result = await getGroupMembers(mockUserId, mockGroupId);

        expect(isUserInGroup).toHaveBeenCalledWith(mockUserId, mockGroupId);
        expect(result).toEqual(mockMembers);
    });

    it("should throw NotFoundError when group not found after auth", async () => {
        (Group.findById as Mock).mockReturnValue({
            populate: vi.fn().mockResolvedValue(null),
        });

        await expect(getGroupMembers(mockUserId, mockGroupId)).rejects.toThrow(NotFoundError);
    });
});

// ─── joinGroup ───────────────────────────────────────────────

describe("joinGroup", () => {
    it("should add user to group and group to user", async () => {
        const mockUser = createMockUser({ _id: new Types.ObjectId(mockMemberId) });
        const mockGroup = createMockGroup({ members: [] });

        (User.findById as Mock).mockResolvedValue(mockUser);
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        const result = await joinGroup(mockMemberId, mockGroupId);

        expect(mockGroup.members).toHaveLength(1);
        expect(mockGroup.save).toHaveBeenCalled();
        expect(mockUser.save).toHaveBeenCalled();
        expect(result.username).toBe("testuser");
    });

    it("should throw ConflictError when user is already a member", async () => {
        const memberUser = createMockUser();
        const mockGroup = createMockGroup();

        (User.findById as Mock).mockResolvedValue(memberUser);
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        await expect(joinGroup(mockUserId, mockGroupId)).rejects.toThrow(ConflictError);
    });

    it("should throw NotFoundError when user not found", async () => {
        (User.findById as Mock).mockResolvedValue(null);

        await expect(joinGroup(mockUserId, mockGroupId)).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when group not found", async () => {
        (User.findById as Mock).mockResolvedValue(createMockUser());
        (Group.findById as Mock).mockResolvedValue(null);

        await expect(joinGroup(mockUserId, mockGroupId)).rejects.toThrow(NotFoundError);
    });
});

// ─── removeMember ────────────────────────────────────────────

describe("removeMember", () => {
    it("should remove member from group", async () => {
        const memberUserId = new Types.ObjectId();
        const mockMember = createMockUser({
            _id: memberUserId,
            groups: [mockGroupId],
        });
        const adminUser = createMockUser();
        const mockGroup = createMockGroup({
            members: [
                {
                    user: new Types.ObjectId(mockUserId),
                    name: "admin",
                    joinedAt: new Date("2024-01-01"),
                },
                { user: memberUserId, name: "member", joinedAt: new Date("2024-02-01") },
            ],
        });

        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (User.findById as Mock)
            .mockResolvedValueOnce(mockMember) // memberId lookup
            .mockResolvedValueOnce(adminUser); // userId lookup
        (Group.findByIdAndDelete as Mock).mockResolvedValue(undefined);

        const result = await removeMember(mockUserId, mockGroupId, memberUserId.toString());

        expect(result.deleted).toBe(false);
        expect(mockGroup.save).toHaveBeenCalled();
        expect(mockMember.save).toHaveBeenCalled();
    });

    it("should delete group when last member leaves", async () => {
        const mockUser = createMockUser({ groups: [mockGroupId] });
        const mockGroup = createMockGroup({
            members: [
                { user: new Types.ObjectId(mockUserId), name: "admin", joinedAt: new Date() },
            ],
        });
        mockGroup.members = {
            filter: vi.fn().mockReturnValue([]),
            length: 0,
            some: vi.fn().mockReturnValue(true),
        } as any;

        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (User.findById as Mock).mockResolvedValue(mockUser);
        (Group.findByIdAndDelete as Mock).mockResolvedValue(undefined);

        const result = await removeMember(mockUserId, mockGroupId, mockUserId);

        expect(result.deleted).toBe(true);
        expect(Group.findByIdAndDelete).toHaveBeenCalledWith(mockGroupId);
    });

    it("should throw ForbiddenError when non-admin removes another member", async () => {
        const otherAdminId = new Types.ObjectId();
        const mockGroup = createMockGroup({
            admin: otherAdminId,
            members: [
                { user: otherAdminId, name: "admin" },
                { user: new Types.ObjectId(mockUserId), name: "member" },
                { user: new Types.ObjectId(mockMemberId), name: "target" },
            ],
        });
        const requestUser = createMockUser();
        const targetMember = createMockUser({ _id: new Types.ObjectId(mockMemberId) });

        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (User.findById as Mock)
            .mockResolvedValueOnce(targetMember)
            .mockResolvedValueOnce(requestUser);

        await expect(removeMember(mockUserId, mockGroupId, mockMemberId)).rejects.toThrow(
            ForbiddenError
        );
    });

    it("should throw NotFoundError when group not found", async () => {
        (Group.findById as Mock).mockResolvedValue(null);

        await expect(removeMember(mockUserId, mockGroupId, mockMemberId)).rejects.toThrow(
            NotFoundError
        );
    });
});

// ─── addPointsToMember ───────────────────────────────────────

describe("addPointsToMember", () => {
    function createMockMember(overrides = {}) {
        return {
            user: new Types.ObjectId(mockUserId),
            points: 10,
            streak: 3,
            lastPointDate: null as Date | null,
            ...overrides,
        };
    }

    function createPointsGroup(
        member: ReturnType<typeof createMockMember>,
        lastQuestionDate: Date | null = null
    ) {
        return {
            features: { questions: { settings: { lastQuestionDate } } },
            members: [member],
            save: vi.fn().mockResolvedValue(undefined),
        } as any;
    }

    it("should add points to member", async () => {
        const member = createMockMember();
        const group = createPointsGroup(member);

        await addPointsToMember(group, mockUserId, 5);

        expect(member.points).toBe(15);
        expect(group.save).toHaveBeenCalled();
    });

    it("should throw when member is not found in group", async () => {
        const group = createPointsGroup(createMockMember({ user: new Types.ObjectId() }));

        await expect(addPointsToMember(group, mockUserId, 5)).rejects.toThrow(
            "Member not found in group"
        );
    });

    it("should increment streak if last points were given yesterday", async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const member = createMockMember({ streak: 5, lastPointDate: yesterday });
        const group = createPointsGroup(member);

        await addPointsToMember(group, mockUserId, 1);

        expect(member.streak).toBe(6);
    });

    it("should keep streak if points already given today", async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const member = createMockMember({ streak: 5, lastPointDate: today });
        const group = createPointsGroup(member);

        await addPointsToMember(group, mockUserId, 1);

        expect(member.streak).toBe(5);
    });

    it("should reset streak to 1 if a day was missed", async () => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        twoDaysAgo.setHours(0, 0, 0, 0);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const member = createMockMember({ streak: 5, lastPointDate: twoDaysAgo });
        const group = createPointsGroup(member, yesterday);

        await addPointsToMember(group, mockUserId, 1);

        expect(member.streak).toBe(1);
    });

    it("should continue streak if no questions were available", async () => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        threeDaysAgo.setHours(0, 0, 0, 0);

        const member = createMockMember({ streak: 5, lastPointDate: threeDaysAgo });
        const group = createPointsGroup(member, threeDaysAgo);

        await addPointsToMember(group, mockUserId, 1);

        expect(member.streak).toBe(6);
    });
});
