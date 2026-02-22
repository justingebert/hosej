import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Types } from "mongoose";

// Mock dependencies before importing the module under test
vi.mock("@/db/models/Group");
vi.mock("@/db/models/AppConfig");

// Now import the modules
import Group from "@/db/models/Group";
import AppConfig from "@/db/models/AppConfig";
import { ForbiddenError, NotFoundError } from "@/lib/api/errorHandling";
import { isUserAdmin, isUserInGroup } from "@/lib/services/group";
import { getGlobalConfig, isGlobalAdmin, updateGlobalConfig } from "@/lib/services/user/admin";

describe("admin", () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockGroupId = new Types.ObjectId().toString();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("isUserInGroup", () => {
        it("should return authorized when user is a member", async () => {
            const mockGroup = {
                members: [{ user: new Types.ObjectId(mockUserId) }],
            };
            (Group.findById as Mock).mockResolvedValue(mockGroup);

            const result = await isUserInGroup(mockUserId, mockGroupId);

            expect(result).toEqual({ isAuthorized: true });
        });

        it("should throw NotFoundError when group does not exist", async () => {
            (Group.findById as Mock).mockResolvedValue(null);

            await expect(isUserInGroup(mockUserId, mockGroupId)).rejects.toThrow(NotFoundError);
            await expect(isUserInGroup(mockUserId, mockGroupId)).rejects.toThrow("Group not found");
        });

        it("should throw ForbiddenError when user is not a member", async () => {
            const otherUserId = new Types.ObjectId();
            const mockGroup = {
                members: [{ user: otherUserId }],
            };
            (Group.findById as Mock).mockResolvedValue(mockGroup);

            await expect(isUserInGroup(mockUserId, mockGroupId)).rejects.toThrow(ForbiddenError);
            await expect(isUserInGroup(mockUserId, mockGroupId)).rejects.toThrow(
                "You are not a member of this group"
            );
        });
    });

    describe("isUserAdmin", () => {
        it("should return successfully when user is admin", async () => {
            const mockGroup = {
                admin: new Types.ObjectId(mockUserId),
            };
            (Group.findById as Mock).mockResolvedValue(mockGroup);

            // Should not throw
            await expect(isUserAdmin(mockUserId, mockGroupId)).resolves.toBeUndefined();
        });

        it("should throw NotFoundError when group does not exist", async () => {
            (Group.findById as Mock).mockResolvedValue(null);

            await expect(isUserAdmin(mockUserId, mockGroupId)).rejects.toThrow(NotFoundError);
        });

        it("should throw ForbiddenError when user is not admin", async () => {
            const mockGroup = {
                admin: new Types.ObjectId(), // different user
            };
            (Group.findById as Mock).mockResolvedValue(mockGroup);

            await expect(isUserAdmin(mockUserId, mockGroupId)).rejects.toThrow(ForbiddenError);
            await expect(isUserAdmin(mockUserId, mockGroupId)).rejects.toThrow(
                "You are not an admin of this group"
            );
        });
    });

    describe("isGlobalAdmin", () => {
        it("should return true when user is in adminUsers", async () => {
            const mockConfig = {
                adminUsers: [new Types.ObjectId(mockUserId)],
            };
            (AppConfig.findOne as Mock).mockResolvedValue(mockConfig);

            const result = await isGlobalAdmin(mockUserId);

            expect(result).toBe(true);
        });

        it("should return false when user is not in adminUsers", async () => {
            const mockConfig = {
                adminUsers: [new Types.ObjectId()], // different user
            };
            (AppConfig.findOne as Mock).mockResolvedValue(mockConfig);

            const result = await isGlobalAdmin(mockUserId);

            expect(result).toBe(false);
        });

        it("should return false when config does not exist", async () => {
            (AppConfig.findOne as Mock).mockResolvedValue(null);

            const result = await isGlobalAdmin(mockUserId);

            expect(result).toBe(false);
        });

        it("should work with ObjectId input", async () => {
            const userObjectId = new Types.ObjectId(mockUserId);
            const mockConfig = {
                adminUsers: [userObjectId],
            };
            (AppConfig.findOne as Mock).mockResolvedValue(mockConfig);

            const result = await isGlobalAdmin(userObjectId);

            expect(result).toBe(true);
        });
    });

    describe("getGlobalConfig", () => {
        it("should return config when it exists", async () => {
            const mockConfig = { configKey: "global_features", someFeature: true };
            (AppConfig.findOne as Mock).mockReturnValue({
                orFail: vi.fn().mockResolvedValue(mockConfig),
            });

            const result = await getGlobalConfig();

            expect(result).toEqual(mockConfig);
        });

        it("should throw when config does not exist", async () => {
            (AppConfig.findOne as Mock).mockReturnValue({
                orFail: vi.fn().mockRejectedValue(new Error("Document not found")),
            });

            await expect(getGlobalConfig()).rejects.toThrow();
        });
    });

    describe("updateGlobalConfig", () => {
        it("should update features and save config", async () => {
            const mockConfig = {
                configKey: "global_features",
                features: {
                    questions: { status: "enabled" },
                    rallies: { status: "enabled" },
                    jukebox: { status: "enabled" },
                },
                adminUsers: [],
                updatedAt: new Date(),
                save: vi.fn().mockResolvedValue(undefined),
            };
            (AppConfig.findOne as Mock).mockResolvedValue(mockConfig);

            const result = await updateGlobalConfig({
                features: { questions: { status: "disabled" } },
            });

            expect(mockConfig.features.questions.status).toBe("disabled");
            expect(mockConfig.save).toHaveBeenCalled();
            expect(result).toBe(mockConfig);
        });

        it("should save without changes when no features provided", async () => {
            const mockConfig = {
                configKey: "global_features",
                features: { questions: { status: "enabled" } },
                save: vi.fn().mockResolvedValue(undefined),
            };
            (AppConfig.findOne as Mock).mockResolvedValue(mockConfig);

            await updateGlobalConfig({});

            expect(mockConfig.save).toHaveBeenCalled();
        });

        it("should throw NotFoundError when config does not exist", async () => {
            const { NotFoundError } = await import("@/lib/api/errorHandling");
            (AppConfig.findOne as Mock).mockResolvedValue(null);

            await expect(updateGlobalConfig({ features: {} as any })).rejects.toThrow(
                NotFoundError
            );
        });
    });
});
