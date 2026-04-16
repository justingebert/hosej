import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser, makeGroup } from "@/test/factories";
import AppConfig from "@/db/models/AppConfig";
import { ForbiddenError, NotFoundError } from "@/lib/api/errorHandling";
import { isUserAdmin, isUserInGroup } from "@/lib/services/group";
import { getGlobalConfig, isGlobalAdmin, updateGlobalConfig } from "./admin";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("isUserInGroup", () => {
    it("resolves when user is a member", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            members: [{ user: user._id, name: "member" }],
        });

        await expect(
            isUserInGroup(user._id.toString(), group._id.toString())
        ).resolves.toBeUndefined();
    });

    it("throws NotFoundError when group does not exist", async () => {
        const user = await makeUser();

        await expect(
            isUserInGroup(user._id.toString(), new Types.ObjectId().toString())
        ).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when user is not a member", async () => {
        const other = await makeUser();
        const group = await makeGroup({
            members: [{ user: other._id, name: "other" }],
        });
        const outsider = await makeUser();

        await expect(isUserInGroup(outsider._id.toString(), group._id.toString())).rejects.toThrow(
            ForbiddenError
        );
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

    it("throws NotFoundError when group does not exist", async () => {
        const user = await makeUser();

        await expect(
            isUserAdmin(user._id.toString(), new Types.ObjectId().toString())
        ).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when user is not admin", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });
        const outsider = await makeUser();

        await expect(isUserAdmin(outsider._id.toString(), group._id.toString())).rejects.toThrow(
            ForbiddenError
        );
    });
});

describe("isGlobalAdmin", () => {
    it("returns true when user is in adminUsers", async () => {
        const user = await makeUser();
        await AppConfig.create({
            configKey: "global_features",
            adminUsers: [user._id],
        });

        await expect(isGlobalAdmin(user._id.toString())).resolves.toBe(true);
    });

    it("returns false when user is not in adminUsers", async () => {
        const other = await makeUser();
        await AppConfig.create({
            configKey: "global_features",
            adminUsers: [other._id],
        });
        const user = await makeUser();

        await expect(isGlobalAdmin(user._id.toString())).resolves.toBe(false);
    });

    it("returns false when config does not exist", async () => {
        await expect(isGlobalAdmin(new Types.ObjectId().toString())).resolves.toBe(false);
    });

    it("works with ObjectId input", async () => {
        const user = await makeUser();
        await AppConfig.create({
            configKey: "global_features",
            adminUsers: [user._id],
        });

        await expect(isGlobalAdmin(user._id)).resolves.toBe(true);
    });
});

describe("getGlobalConfig", () => {
    it("returns config when it exists", async () => {
        await AppConfig.create({ configKey: "global_features" });

        const result = await getGlobalConfig();

        expect(result.configKey).toBe("global_features");
    });

    it("throws when config does not exist", async () => {
        await expect(getGlobalConfig()).rejects.toThrow();
    });
});

describe("updateGlobalConfig", () => {
    it("updates features and persists", async () => {
        await AppConfig.create({ configKey: "global_features" });

        // NOTE: service currently expects a full features object (see src/lib/services/user/admin.ts:58
        // where the spread overwrites sibling keys with undefined). Passing the full shape works.
        const result = await updateGlobalConfig({
            features: {
                questions: { status: "disabled" },
                rallies: { status: "enabled" },
                jukebox: { status: "enabled" },
            },
        });

        expect(result.features.questions.status).toBe("disabled");

        const reloaded = await AppConfig.findOne({ configKey: "global_features" });
        expect(reloaded?.features.questions.status).toBe("disabled");
    });

    it("saves without changes when no features provided", async () => {
        await AppConfig.create({ configKey: "global_features" });

        const before = await AppConfig.findOne({ configKey: "global_features" });
        const beforeUpdatedAt = before!.updatedAt.getTime();

        await new Promise((r) => setTimeout(r, 5));
        await updateGlobalConfig({});

        const after = await AppConfig.findOne({ configKey: "global_features" });
        expect(after!.updatedAt.getTime()).toBeGreaterThan(beforeUpdatedAt);
    });

    it("throws NotFoundError when config does not exist", async () => {
        await expect(updateGlobalConfig({ features: {} })).rejects.toThrow(NotFoundError);
    });
});
