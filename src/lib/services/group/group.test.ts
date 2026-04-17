import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

vi.mock("@/lib/services/question", () => ({
    addTemplatePackToGroup: vi.fn().mockResolvedValue(undefined),
    activateSmartQuestions: vi.fn().mockResolvedValue([]),
}));
vi.mock("../jukebox", () => ({ createGroupJukebox: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../rally", () => ({
    createRally: vi.fn().mockResolvedValue(undefined),
    activateCreatedRallies: vi.fn().mockResolvedValue(undefined),
    activateRallies: vi.fn().mockResolvedValue(undefined),
}));

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import {
    makeUser,
    makeGroup,
    makeQuestion,
    makeRally,
    makeJukebox,
    makeChat,
} from "@/test/factories";
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
import Jukebox from "@/db/models/Jukebox";
import { addTemplatePackToGroup, activateSmartQuestions } from "@/lib/services/question";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { RallyStatus } from "@/types/models/rally";
import { QuestionType } from "@/types/models/question";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(async () => {
    await clearCollections();
    vi.clearAllMocks();
});

describe("isUserInGroup", () => {
    it("resolves when user is a member", async () => {
        const user = await makeUser();
        const group = await makeGroup({ members: [{ user: user._id, name: "u" }] });

        await expect(
            isUserInGroup(user._id.toString(), group._id.toString())
        ).resolves.toBeUndefined();
    });

    it("throws NotFoundError when group not found", async () => {
        const user = await makeUser();
        await expect(
            isUserInGroup(user._id.toString(), new Types.ObjectId().toString())
        ).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when user is not a member", async () => {
        const member = await makeUser();
        const outsider = await makeUser();
        const group = await makeGroup({ members: [{ user: member._id, name: "m" }] });

        await expect(isUserInGroup(outsider._id.toString(), group._id.toString())).rejects.toThrow(
            ForbiddenError
        );
    });

    it("uses pre-loaded group when provided", async () => {
        const user = await makeUser();
        const group = await makeGroup({ members: [{ user: user._id, name: "u" }] });
        const findSpy = vi.spyOn(Group, "findById");

        await isUserInGroup(user._id.toString(), group._id.toString(), group);

        expect(findSpy).not.toHaveBeenCalled();
    });
});

describe("isUserAdmin", () => {
    it("resolves when user is admin", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });

        await expect(
            isUserAdmin(admin._id.toString(), group._id.toString())
        ).resolves.toBeUndefined();
    });

    it("throws NotFoundError when group not found", async () => {
        const user = await makeUser();
        await expect(
            isUserAdmin(user._id.toString(), new Types.ObjectId().toString())
        ).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when user is not admin", async () => {
        const admin = await makeUser();
        const other = await makeUser();
        const group = await makeGroup({ admin: admin._id });

        await expect(isUserAdmin(other._id.toString(), group._id.toString())).rejects.toThrow(
            ForbiddenError
        );
    });
});

describe("createGroup", () => {
    it("creates group with admin as first member and updates user.groups", async () => {
        const user = await makeUser();

        const result = await createGroup(user._id.toString(), "Test Group");

        expect(result.name).toBe("Test Group");
        expect(result.admin.toString()).toBe(user._id.toString());
        expect(result.members[0].user.toString()).toBe(user._id.toString());

        const reloadedUser = await User.findById(user._id);
        expect(reloadedUser?.groups.map((g) => g.toString())).toContain(result._id.toString());
    });

    it("invokes addTemplatePackToGroup and activateSmartQuestions", async () => {
        const user = await makeUser();

        await createGroup(user._id.toString(), "Test Group");

        expect(addTemplatePackToGroup).toHaveBeenCalled();
        expect(activateSmartQuestions).toHaveBeenCalled();
    });

    it("throws ValidationError when name is missing", async () => {
        const user = await makeUser();
        await expect(createGroup(user._id.toString(), "")).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when user not found", async () => {
        await expect(createGroup(new Types.ObjectId().toString(), "Test Group")).rejects.toThrow(
            NotFoundError
        );
    });
});

describe("getUserGroups", () => {
    it("returns populated groups", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u" }],
        });
        await User.findByIdAndUpdate(user._id, { $push: { groups: group._id } });

        const result = await getUserGroups(user._id.toString());

        expect(result).toHaveLength(1);
        expect((result[0] as { _id: Types.ObjectId })._id.toString()).toBe(group._id.toString());
    });

    it("throws NotFoundError when user not found", async () => {
        await expect(getUserGroups(new Types.ObjectId().toString())).rejects.toThrow(NotFoundError);
    });
});

describe("getGroupWithAdminFlag", () => {
    it("returns userIsAdmin=true for admin", async () => {
        const admin = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [{ user: admin._id, name: "a" }],
        });

        const result = await getGroupWithAdminFlag(admin._id.toString(), group._id.toString());

        expect(result.userIsAdmin).toBe(true);
    });

    it("returns userIsAdmin=false for regular member", async () => {
        const admin = await makeUser();
        const member = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [
                { user: admin._id, name: "a" },
                { user: member._id, name: "m" },
            ],
        });

        const result = await getGroupWithAdminFlag(member._id.toString(), group._id.toString());

        expect(result.userIsAdmin).toBe(false);
    });

    it("throws NotFoundError when group not found", async () => {
        const user = await makeUser();
        await expect(
            getGroupWithAdminFlag(user._id.toString(), new Types.ObjectId().toString())
        ).rejects.toThrow(NotFoundError);
    });
});

describe("updateGroup", () => {
    it("updates group when user is admin", async () => {
        const admin = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [{ user: admin._id, name: "a" }],
        });

        const result = await updateGroup(admin._id.toString(), group._id.toString(), {
            name: "New Name",
        });

        expect(result.name).toBe("New Name");

        const reloaded = await Group.findById(group._id);
        expect(reloaded?.name).toBe("New Name");
    });

    it("throws ForbiddenError when user is not admin", async () => {
        const admin = await makeUser();
        const other = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [
                { user: admin._id, name: "a" },
                { user: other._id, name: "o" },
            ],
        });

        await expect(
            updateGroup(other._id.toString(), group._id.toString(), { name: "New" })
        ).rejects.toThrow(ForbiddenError);
    });
});

describe("deleteGroup", () => {
    it("deletes group and pulls groupId from member user.groups", async () => {
        const admin = await makeUser();
        const member = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [
                { user: admin._id, name: "a" },
                { user: member._id, name: "m" },
            ],
        });
        await User.updateMany(
            { _id: { $in: [admin._id, member._id] } },
            { $push: { groups: group._id } }
        );

        await deleteGroup(admin._id.toString(), group._id.toString());

        expect(await Group.findById(group._id)).toBeNull();

        const adminAfter = await User.findById(admin._id);
        const memberAfter = await User.findById(member._id);
        expect(adminAfter?.groups.map((g) => g.toString()).includes(group._id.toString())).toBe(
            false
        );
        expect(memberAfter?.groups.map((g) => g.toString()).includes(group._id.toString())).toBe(
            false
        );
    });

    it("throws ForbiddenError when user is not admin", async () => {
        const admin = await makeUser();
        const other = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [
                { user: admin._id, name: "a" },
                { user: other._id, name: "o" },
            ],
        });

        await expect(deleteGroup(other._id.toString(), group._id.toString())).rejects.toThrow(
            ForbiddenError
        );
    });
});

describe("getGroupStats", () => {
    it("returns all stat counts from real data", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u" }],
        });

        await makeQuestion({ groupId: group._id, used: true });
        await makeQuestion({ groupId: group._id, used: true });
        await makeQuestion({ groupId: group._id, used: false });

        await makeRally({ groupId: group._id, status: RallyStatus.Completed });
        await makeRally({ groupId: group._id, status: RallyStatus.Created });

        await makeJukebox({ groupId: group._id });

        await makeChat({ group: group._id, entityModel: "Question" });

        const result = await getGroupStats(user._id.toString(), group._id.toString());

        expect(result.questionsUsedCount).toBe(2);
        expect(result.questionsLeftCount).toBe(1);
        expect(result.ralliesCompletedCount).toBe(1);
        expect(result.ralliesCreatedCount).toBe(1);
    });
});

describe("getGroupHistory", () => {
    it("returns used questions for the group", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "u" }],
        });

        await makeQuestion({
            groupId: group._id,
            used: true,
            active: false,
            question: "Used?",
            questionType: QuestionType.Custom,
        });
        await makeQuestion({
            groupId: group._id,
            used: false,
            question: "Unused",
        });

        const result = await getGroupHistory(user._id.toString(), group._id.toString(), 10, 0);

        expect(result).toHaveLength(1);
        expect(result[0].question).toBe("Used?");
    });
});
