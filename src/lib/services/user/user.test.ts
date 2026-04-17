import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser } from "@/test/factories";
import {
    getUserById,
    createDeviceUser,
    updateUser,
    registerPushToken,
    unregisterPushToken,
    generateConnectToken,
    disconnectGoogleAccount,
} from "./user";
import User from "@/db/models/User";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("getUserById", () => {
    it("returns user when found", async () => {
        const user = await makeUser();

        const result = await getUserById(user._id.toString());

        expect(result._id.equals(user._id)).toBe(true);
    });

    it("throws NotFoundError when user not found", async () => {
        await expect(getUserById(new Types.ObjectId().toString())).rejects.toThrow(NotFoundError);
    });
});

describe("createDeviceUser", () => {
    it("creates and persists a new user", async () => {
        const result = await createDeviceUser("device-123", "testuser");

        expect(result.username).toBe("testuser");
        expect(result.deviceId).toBe("device-123");

        const stored = await User.findById(result._id);
        expect(stored).not.toBeNull();
    });

    it("throws ValidationError when deviceId is missing", async () => {
        await expect(createDeviceUser("", "testuser")).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when username is missing", async () => {
        await expect(createDeviceUser("device-123", "")).rejects.toThrow(ValidationError);
    });

    it("throws ConflictError when deviceId already exists", async () => {
        await makeUser({ deviceId: "device-123" });

        await expect(createDeviceUser("device-123", "testuser")).rejects.toThrow(ConflictError);
    });
});

describe("updateUser", () => {
    it("updates username", async () => {
        const user = await makeUser();

        const result = await updateUser(user._id.toString(), { username: "newname" });

        expect(result.username).toBe("newname");
    });

    it("throws NotFoundError when user not found", async () => {
        await expect(
            updateUser(new Types.ObjectId().toString(), { username: "newname" })
        ).rejects.toThrow(NotFoundError);
    });

    it("ignores non-allowlisted fields", async () => {
        const user = await makeUser();

        const result = await updateUser(user._id.toString(), {
            username: "newname",
            // @ts-expect-error — deliberately passing a field not in UpdateUserData
            deviceId: "should-be-ignored",
        });

        expect(result.username).toBe("newname");
        expect(result.deviceId).toBe(user.deviceId);
    });

    it("merges announcementsSeen instead of overwriting (stale client snapshot safe)", async () => {
        const user = await makeUser({ announcementsSeen: ["a", "b"] });

        const result = await updateUser(user._id.toString(), {
            announcementsSeen: ["c"],
        });

        expect(result.announcementsSeen?.sort()).toEqual(["a", "b", "c"]);
    });

    it("deduplicates when adding already-seen ids", async () => {
        const user = await makeUser({ announcementsSeen: ["a"] });

        const result = await updateUser(user._id.toString(), {
            announcementsSeen: ["a", "b", "b"],
        });

        expect(result.announcementsSeen?.sort()).toEqual(["a", "b"]);
    });
});

describe("registerPushToken", () => {
    it("registers a new token", async () => {
        const user = await makeUser();

        const result = await registerPushToken(user._id.toString(), "new-token");
        const reloaded = await User.findById(user._id);

        expect(result.alreadyRegistered).toBe(false);
        expect(reloaded?.fcmToken).toBe("new-token");
    });

    it("returns alreadyRegistered when token matches", async () => {
        const user = await makeUser({ fcmToken: "existing-token" });

        const result = await registerPushToken(user._id.toString(), "existing-token");

        expect(result.alreadyRegistered).toBe(true);
    });

    it("throws ValidationError when token is empty", async () => {
        const user = await makeUser();

        await expect(registerPushToken(user._id.toString(), "")).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when user not found", async () => {
        await expect(registerPushToken(new Types.ObjectId().toString(), "token")).rejects.toThrow(
            NotFoundError
        );
    });
});

describe("unregisterPushToken", () => {
    it("clears fcmToken", async () => {
        const user = await makeUser({ fcmToken: "some-token" });

        await unregisterPushToken(user._id.toString(), "some-token");
        const reloaded = await User.findById(user._id);

        expect(reloaded?.fcmToken).toBeUndefined();
    });

    it("throws ValidationError when token is empty", async () => {
        const user = await makeUser();

        await expect(unregisterPushToken(user._id.toString(), "")).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when user not found", async () => {
        await expect(unregisterPushToken(new Types.ObjectId().toString(), "token")).rejects.toThrow(
            NotFoundError
        );
    });
});

describe("generateConnectToken", () => {
    it("generates and stores a connect token for a device user", async () => {
        const user = await makeUser({ deviceId: "device-123" });

        const token = await generateConnectToken(user._id.toString());
        const reloaded = await User.findById(user._id);

        expect(typeof token).toBe("string");
        expect(token.length).toBeGreaterThan(0);
        expect(reloaded?.connectToken).toBe(token);
        expect(reloaded?.connectTokenExpiresAt).toBeInstanceOf(Date);
    });

    it("throws NotFoundError when user not found", async () => {
        await expect(generateConnectToken(new Types.ObjectId().toString())).rejects.toThrow(
            NotFoundError
        );
    });

    it("throws ValidationError for a non-device user", async () => {
        const user = await makeUser();
        await User.findByIdAndUpdate(user._id, { $unset: { deviceId: "" } });

        await expect(generateConnectToken(user._id.toString())).rejects.toThrow(ValidationError);
    });
});

describe("disconnectGoogleAccount", () => {
    it("sets deviceId and clears google fields", async () => {
        const user = await makeUser({ googleId: "google-123", googleConnected: true });

        await disconnectGoogleAccount(user._id.toString(), "new-device-id");
        const reloaded = await User.findById(user._id);

        expect(reloaded?.deviceId).toBe("new-device-id");
        expect(reloaded?.googleId).toBeUndefined();
        expect(reloaded?.googleConnected).toBe(false);
    });

    it("throws ValidationError when deviceId is missing", async () => {
        const user = await makeUser();

        await expect(disconnectGoogleAccount(user._id.toString(), "")).rejects.toThrow(
            ValidationError
        );
    });

    it("throws NotFoundError when user not found", async () => {
        await expect(
            disconnectGoogleAccount(new Types.ObjectId().toString(), "device-id")
        ).rejects.toThrow(NotFoundError);
    });
});
