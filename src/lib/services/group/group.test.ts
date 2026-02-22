import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Types } from "mongoose";

vi.mock("@/db/models/Group");
vi.mock("@/db/models/User");
vi.mock("@/db/models/Question");
vi.mock("@/db/models/Rally");
vi.mock("@/db/models/Chat");
vi.mock("@/db/dbConnect");
vi.mock("@/lib/services/question");

import {
    isUserInGroup,
    isUserAdmin,
    createGroup,
    getUserGroups,
    getGroupWithAdminFlag,
    updateGroup,
    deleteGroup,
    getGroupStats,
    getGroupHistory,
} from "./group";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import Question from "@/db/models/Question";
import Rally from "@/db/models/Rally";
import Chat from "@/db/models/Chat";
import dbConnect from "@/db/dbConnect";
import { addTemplatePackToGroup, activateSmartQuestions } from "@/lib/services/question";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";

const mockUserId = new Types.ObjectId().toString();
const mockGroupId = new Types.ObjectId().toString();

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
            rallies: { enabled: true, settings: { rallyCount: 1, rallyGapDays: 14 } },
            jukebox: { enabled: true, settings: { concurrent: ["Jukebox"], activationDays: [1] } },
        },
        createdAt: new Date(),
        save: vi.fn().mockResolvedValue(undefined),
        set: vi.fn(),
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
    (addTemplatePackToGroup as Mock).mockResolvedValue(undefined);
    (activateSmartQuestions as Mock).mockResolvedValue([]);
});

// ─── Authorization helpers ───────────────────────────────────

describe("isUserInGroup", () => {
    it("should return authorized when user is a member", async () => {
        const mockGroup = createMockGroup();
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        const result = await isUserInGroup(mockUserId, mockGroupId);

        expect(result).toEqual({ isAuthorized: true });
    });

    it("should throw NotFoundError when group not found", async () => {
        (Group.findById as Mock).mockResolvedValue(null);

        await expect(isUserInGroup(mockUserId, mockGroupId)).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when user is not a member", async () => {
        const otherUserId = new Types.ObjectId().toString();
        const mockGroup = createMockGroup();
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        await expect(isUserInGroup(otherUserId, mockGroupId)).rejects.toThrow(ForbiddenError);
    });

    it("should use pre-loaded group when provided", async () => {
        const mockGroup = createMockGroup();

        await isUserInGroup(mockUserId, mockGroupId, mockGroup as any);

        expect(Group.findById).not.toHaveBeenCalled();
    });
});

describe("isUserAdmin", () => {
    it("should resolve when user is admin", async () => {
        const mockGroup = createMockGroup();
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        await expect(isUserAdmin(mockUserId, mockGroupId)).resolves.toBeUndefined();
    });

    it("should throw NotFoundError when group not found", async () => {
        (Group.findById as Mock).mockResolvedValue(null);

        await expect(isUserAdmin(mockUserId, mockGroupId)).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when user is not admin", async () => {
        const mockGroup = createMockGroup({ admin: new Types.ObjectId() });
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        await expect(isUserAdmin(mockUserId, mockGroupId)).rejects.toThrow(ForbiddenError);
    });

    it("should use pre-loaded group when provided", async () => {
        const mockGroup = createMockGroup();

        await isUserAdmin(mockUserId, mockGroupId, mockGroup as any);

        expect(Group.findById).not.toHaveBeenCalled();
    });
});

// ─── Group CRUD ──────────────────────────────────────────────

describe("createGroup", () => {
    it("should create group with admin as first member", async () => {
        const mockUser = createMockUser();
        const mockGroup = createMockGroup();

        (User.findById as Mock).mockResolvedValue(mockUser);
        vi.mocked(Group).mockImplementation(function (this: any, data: any) {
            Object.assign(this, mockGroup, data);
            this.save = mockGroup.save;
            this._id = mockGroup._id;
            return this;
        } as any);

        const result = await createGroup(mockUserId, "Test Group");

        expect(result.save).toHaveBeenCalled();
        expect(mockUser.save).toHaveBeenCalled();
    });

    it("should call addTemplatePackToGroup and activateSmartQuestions", async () => {
        const mockUser = createMockUser();
        const mockGroup = createMockGroup();

        (User.findById as Mock).mockResolvedValue(mockUser);
        vi.mocked(Group).mockImplementation(function (this: any, data: any) {
            Object.assign(this, mockGroup, data);
            this.save = mockGroup.save;
            this._id = mockGroup._id;
            return this;
        } as any);

        await createGroup(mockUserId, "Test Group");

        expect(addTemplatePackToGroup).toHaveBeenCalled();
        expect(activateSmartQuestions).toHaveBeenCalled();
    });

    it("should throw ValidationError when name is missing", async () => {
        await expect(createGroup(mockUserId, "")).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError when user not found", async () => {
        (User.findById as Mock).mockResolvedValue(null);

        await expect(createGroup(mockUserId, "Test Group")).rejects.toThrow(NotFoundError);
    });
});

describe("getUserGroups", () => {
    it("should return populated groups", async () => {
        const mockGroups = [createMockGroup()];
        const mockUser = createMockUser({ groups: mockGroups });
        (User.findById as Mock).mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockUser),
        });

        const result = await getUserGroups(mockUserId);

        expect(result).toEqual(mockGroups);
    });

    it("should throw NotFoundError when user not found", async () => {
        (User.findById as Mock).mockReturnValue({
            populate: vi.fn().mockResolvedValue(null),
        });

        await expect(getUserGroups(mockUserId)).rejects.toThrow(NotFoundError);
    });
});

describe("getGroupWithAdminFlag", () => {
    it("should return group with userIsAdmin=true for admin", async () => {
        const groupData = {
            _id: new Types.ObjectId(mockGroupId),
            name: "Test Group",
            admin: new Types.ObjectId(mockUserId),
            members: [{ user: new Types.ObjectId(mockUserId), name: "testuser" }],
        };
        const mockGroup = {
            ...groupData,
            toObject: vi.fn().mockReturnValue(groupData),
            admin: { equals: vi.fn().mockReturnValue(true) },
            members: groupData.members,
            save: vi.fn(),
        };
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        const result = await getGroupWithAdminFlag(mockUserId, mockGroupId);

        expect(result.userIsAdmin).toBe(true);
    });

    it("should return group with userIsAdmin=false for regular member", async () => {
        const otherAdminId = new Types.ObjectId();
        const groupData = {
            _id: new Types.ObjectId(mockGroupId),
            name: "Test Group",
            admin: otherAdminId,
            members: [{ user: new Types.ObjectId(mockUserId), name: "testuser" }],
        };
        const mockGroup = {
            ...groupData,
            toObject: vi.fn().mockReturnValue(groupData),
            admin: { equals: vi.fn().mockReturnValue(false) },
            members: groupData.members,
            save: vi.fn(),
        };
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        const result = await getGroupWithAdminFlag(mockUserId, mockGroupId);

        expect(result.userIsAdmin).toBe(false);
    });

    it("should throw NotFoundError when group not found", async () => {
        (Group.findById as Mock).mockResolvedValue(null);

        await expect(getGroupWithAdminFlag(mockUserId, mockGroupId)).rejects.toThrow(NotFoundError);
    });
});

describe("updateGroup", () => {
    it("should update group when user is admin", async () => {
        const mockGroup = createMockGroup();
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        const result = await updateGroup(mockUserId, mockGroupId, { name: "New Name" });

        expect(mockGroup.set).toHaveBeenCalledWith({ name: "New Name" });
        expect(mockGroup.save).toHaveBeenCalled();
        expect(result).toEqual(mockGroup);
    });

    it("should throw ForbiddenError when user is not admin", async () => {
        const mockGroup = createMockGroup({ admin: new Types.ObjectId() });
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        await expect(updateGroup(mockUserId, mockGroupId, { name: "New" })).rejects.toThrow(
            ForbiddenError
        );
    });
});

describe("deleteGroup", () => {
    it("should delete group and bulk-remove groupId from members", async () => {
        const mockGroup = createMockGroup();
        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (User.updateMany as Mock).mockResolvedValue({ modifiedCount: 1 });
        (Group.findByIdAndDelete as Mock).mockResolvedValue(undefined);

        await deleteGroup(mockUserId, mockGroupId);

        expect(User.updateMany).toHaveBeenCalledWith(
            { _id: { $in: expect.any(Array) } },
            { $pull: { groups: mockGroupId } }
        );
        expect(Group.findByIdAndDelete).toHaveBeenCalledWith(mockGroupId);
    });

    it("should throw ForbiddenError when user is not admin", async () => {
        const mockGroup = createMockGroup({ admin: new Types.ObjectId() });
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        await expect(deleteGroup(mockUserId, mockGroupId)).rejects.toThrow(ForbiddenError);
    });
});

// ─── Stats ───────────────────────────────────────────────────

describe("getGroupStats", () => {
    it("should return all stat counts", async () => {
        const mockGroup = createMockGroup();
        (Group.findById as Mock)
            .mockResolvedValueOnce(mockGroup) // isUserInGroup lookup
            .mockResolvedValueOnce(mockGroup); // stats lookup
        (Question.countDocuments as Mock)
            .mockResolvedValueOnce(10) // used
            .mockResolvedValueOnce(5); // unused
        (Question.aggregate as Mock)
            .mockResolvedValueOnce([{ _id: "custom", count: 5 }])
            .mockResolvedValueOnce([{ username: "testuser", count: 3 }]);
        (Rally.countDocuments as Mock)
            .mockResolvedValueOnce(3) // used
            .mockResolvedValueOnce(2); // unused
        (Chat.aggregate as Mock).mockResolvedValue([{ messagesCount: 42 }]);

        const result = await getGroupStats(mockUserId, mockGroupId);

        expect(result.questionsUsedCount).toBe(10);
        expect(result.questionsLeftCount).toBe(5);
        expect(result.RalliesUsedCount).toBe(3);
        expect(result.RalliesLeftCount).toBe(2);
        expect(result.messagesCount).toBe(42);
        expect(result.questionsByType).toHaveLength(1);
        expect(result.questionsByUser).toHaveLength(1);
    });
});

// ─── History ─────────────────────────────────────────────────

describe("getGroupHistory", () => {
    it("should return paginated questions", async () => {
        const mockGroup = createMockGroup();
        const mockQuestions = [{ question: "test?" }];

        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (Question.find as Mock).mockReturnValue({
            skip: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                    sort: vi.fn().mockResolvedValue(mockQuestions),
                }),
            }),
        });

        const result = await getGroupHistory(mockUserId, mockGroupId, 10, 0);

        expect(result).toEqual(mockQuestions);
        expect(Question.find).toHaveBeenCalledWith(
            expect.objectContaining({
                groupId: mockGroupId,
                used: true,
                active: false,
            })
        );
    });
});
