import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeGroup, makeUser } from "@/test/factories";
import {
    getUserById,
    createDeviceUser,
    updateUser,
    deleteUser,
    registerPushToken,
    unregisterPushToken,
    generateConnectToken,
    disconnectGoogleAccount,
} from "./user";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { hashDeviceId } from "@/lib/auth/deviceCredential";

const DEVICE_ID_A = "11111111-1111-4111-8111-111111111111";
const DEVICE_ID_B = "22222222-2222-4222-8222-222222222222";
const DEVICE_ID_C = "33333333-3333-4333-8333-333333333333";

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
        const result = await createDeviceUser(DEVICE_ID_A, "testuser");

        expect(result.username).toBe("testuser");
        expect(result.deviceId).toBeUndefined();
        expect(result.deviceIdHash).toBe(hashDeviceId(DEVICE_ID_A));

        const stored = await User.findById(result._id);
        expect(stored).not.toBeNull();
    });

    it("throws ValidationError when deviceId is missing", async () => {
        await expect(createDeviceUser("", "testuser")).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when username is missing", async () => {
        await expect(createDeviceUser(DEVICE_ID_A, "")).rejects.toThrow(ValidationError);
    });

    it("throws ConflictError when deviceId already exists", async () => {
        await makeUser({ deviceId: DEVICE_ID_A });

        await expect(createDeviceUser(DEVICE_ID_A, "testuser")).rejects.toThrow(ConflictError);
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

describe("deleteUser", () => {
    it("deletes the user and removes them from remaining groups", async () => {
        const user = await makeUser();
        const member = await makeUser();
        const group = await makeGroup({
            admin: member._id,
            members: [
                { user: member._id, name: "member" },
                { user: user._id, name: "delete me" },
            ],
        });
        await User.updateMany(
            { _id: { $in: [user._id, member._id] } },
            { $push: { groups: group._id } }
        );

        await deleteUser(user._id.toString());

        expect(await User.findById(user._id)).toBeNull();

        const reloadedGroup = await Group.findById(group._id);
        expect(reloadedGroup?.members.map((m) => m.user.toString())).toEqual([
            member._id.toString(),
        ]);
        expect(reloadedGroup?.admin.toString()).toBe(member._id.toString());

        const memberAfter = await User.findById(member._id);
        expect(memberAfter?.groups.map((g) => g.toString())).toContain(group._id.toString());
    });

    it("transfers admin to the earliest joined remaining member", async () => {
        const admin = await makeUser();
        const earlyMember = await makeUser();
        const lateMember = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [
                { user: admin._id, name: "admin" },
                { user: lateMember._id, name: "late" },
                { user: earlyMember._id, name: "early" },
            ],
        });
        group.members[1].joinedAt = new Date("2024-02-01T00:00:00.000Z");
        group.members[2].joinedAt = new Date("2024-01-01T00:00:00.000Z");
        await group.save();

        await deleteUser(admin._id.toString());

        const reloadedGroup = await Group.findById(group._id);
        expect(reloadedGroup?.admin.toString()).toBe(earlyMember._id.toString());
        expect(reloadedGroup?.members.some((m) => m.user.equals(admin._id))).toBe(false);
    });

    it("deletes groups where the user is the only member", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "solo" }],
        });

        await deleteUser(user._id.toString());

        expect(await User.findById(user._id)).toBeNull();
        expect(await Group.findById(group._id)).toBeNull();
    });

    it("throws NotFoundError when user not found", async () => {
        await expect(deleteUser(new Types.ObjectId().toString())).rejects.toThrow(NotFoundError);
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
        const user = await makeUser({ deviceId: DEVICE_ID_A });

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
        await User.findByIdAndUpdate(user._id, { $unset: { deviceId: "", deviceIdHash: "" } });

        await expect(generateConnectToken(user._id.toString())).rejects.toThrow(ValidationError);
    });
});

describe("disconnectGoogleAccount", () => {
    it("sets deviceId and clears google fields", async () => {
        const user = await makeUser({ googleId: "google-123", googleConnected: true });

        await disconnectGoogleAccount(user._id.toString(), DEVICE_ID_B);
        const reloaded = await User.findById(user._id);

        expect(reloaded?.deviceId).toBeUndefined();
        expect(reloaded?.deviceIdHash).toBe(hashDeviceId(DEVICE_ID_B));
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
            disconnectGoogleAccount(new Types.ObjectId().toString(), DEVICE_ID_C)
        ).rejects.toThrow(NotFoundError);
    });

    it("throws ValidationError when no Google account is linked", async () => {
        const user = await makeUser({ deviceId: DEVICE_ID_A });

        await expect(disconnectGoogleAccount(user._id.toString(), DEVICE_ID_B)).rejects.toThrow(
            ValidationError
        );
    });
});

describe("user serialization", () => {
    it("omits auth secrets and verifiers from JSON", async () => {
        const user = await makeUser({ googleId: "g-secret", fcmToken: "fcm-secret" });
        user.connectToken = "live-connect-token";
        user.mobileRefreshTokens = [
            { tokenHash: "h", expiresAt: new Date(Date.now() + 60_000), createdAt: new Date() },
        ];
        await user.save();

        const json = JSON.parse(JSON.stringify(user));

        for (const field of [
            "deviceId",
            "deviceIdHash",
            "connectToken",
            "connectTokenExpiresAt",
            "mobileRefreshTokens",
            "mobileSessionVersion",
            "googleId",
            "fcmToken",
        ]) {
            expect(json[field]).toBeUndefined();
        }
        expect(json.username).toBe(user.username);
        expect(json._id).toBeTruthy();
    });
});
