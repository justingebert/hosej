// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser } from "@/test/factories";
import {
    getUserByDeviceId,
    findOrCreateGoogleUser,
    linkGoogleToUser,
    issueMobileAuthBody,
    getUserByMobileRefreshToken,
    revokeMobileRefreshToken,
    assertValidMobileAccessToken,
} from "./user";
import { NotFoundError, ConflictError, ValidationError, AuthError } from "@/lib/api/errorHandling";
import User from "@/db/models/User";
import { hashDeviceId } from "@/lib/auth/deviceCredential";
import { decodeMobileToken } from "@/lib/auth/mobileToken";

const DEVICE_ID_A = "11111111-1111-4111-8111-111111111111";
const DEVICE_ID_B = "22222222-2222-4222-8222-222222222222";
const DEVICE_ID_C = "33333333-3333-4333-8333-333333333333";
const DEVICE_ID_MISSING = "44444444-4444-4444-8444-444444444444";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("getUserByDeviceId", () => {
    it("returns the user for a known deviceId", async () => {
        const created = await makeUser({ deviceId: DEVICE_ID_A, username: "bob" });

        const user = await getUserByDeviceId(DEVICE_ID_A);

        expect(user.username).toBe("bob");
        expect(user.deviceId).toBeUndefined();
        expect(user.deviceIdHash).toBe(hashDeviceId(DEVICE_ID_A));
        const stored = await User.findById(created._id);
        expect(stored?.deviceId).toBeUndefined();
    });

    it("throws NotFoundError for an unknown deviceId", async () => {
        await expect(getUserByDeviceId(DEVICE_ID_MISSING)).rejects.toThrow(NotFoundError);
    });
});

describe("findOrCreateGoogleUser", () => {
    it("creates a new google user when none exists", async () => {
        const { user, isNew } = await findOrCreateGoogleUser("g-1", "Alice");

        expect(isNew).toBe(true);
        expect(user.googleId).toBe("g-1");
        expect(user.googleConnected).toBe(true);
        expect(user.username).toBe("Alice");
    });

    it("returns the existing user without creating a duplicate", async () => {
        await findOrCreateGoogleUser("g-1", "Alice");

        const { user, isNew } = await findOrCreateGoogleUser("g-1", "Ignored");

        expect(isNew).toBe(false);
        expect(user.username).toBe("Alice");
        expect(await User.countDocuments({ googleId: "g-1" })).toBe(1);
    });

    it("falls back to a non-empty placeholder username when no name is provided", async () => {
        const { user } = await findOrCreateGoogleUser("g-2");

        expect(user.username).toBe("New user");
    });
});

describe("linkGoogleToUser", () => {
    it("links google and clears the device credential", async () => {
        const device = await makeUser({ deviceId: DEVICE_ID_A, username: "carol" });

        const user = await linkGoogleToUser(device._id.toString(), "g-9");

        expect(user.googleId).toBe("g-9");
        expect(user.googleConnected).toBe(true);
        expect(user.deviceId).toBeUndefined();
        expect(user.deviceIdHash).toBeUndefined();
    });

    it("throws ConflictError when the google account belongs to another user", async () => {
        await makeUser({ googleId: "g-taken" });
        const device = await makeUser({ deviceId: DEVICE_ID_B });

        await expect(linkGoogleToUser(device._id.toString(), "g-taken")).rejects.toThrow(
            ConflictError
        );
    });

    it("rejects re-linking after the device credential has been cleared", async () => {
        const device = await makeUser({ deviceId: DEVICE_ID_C });
        await linkGoogleToUser(device._id.toString(), "g-self");

        await expect(linkGoogleToUser(device._id.toString(), "g-self")).rejects.toThrow(
            ValidationError
        );
    });
});

describe("mobile sessions", () => {
    it("stores refresh tokens hashed and rotates them on use", async () => {
        const user = await makeUser();

        const first = await issueMobileAuthBody(user);
        const stored = await User.findById(user._id);

        expect(typeof first.accessToken).toBe("string");
        expect(first.refreshToken).not.toBe(stored?.mobileRefreshTokens?.[0]?.tokenHash);
        expect(stored?.mobileRefreshTokens).toHaveLength(1);

        const refreshedUser = await getUserByMobileRefreshToken(first.refreshToken);
        const second = await issueMobileAuthBody(refreshedUser);

        await expect(getUserByMobileRefreshToken(first.refreshToken)).rejects.toThrow(AuthError);
        const fromSecondRefresh = await getUserByMobileRefreshToken(second.refreshToken);
        expect(fromSecondRefresh._id.equals(user._id)).toBe(true);
    });

    it("rejects old mobile access tokens after linking Google", async () => {
        const user = await makeUser({ deviceId: DEVICE_ID_A });
        const body = await issueMobileAuthBody(user);
        const token = await decodeMobileToken(body.accessToken);

        expect(token).not.toBeNull();
        await expect(assertValidMobileAccessToken(token!)).resolves.toBeUndefined();

        await linkGoogleToUser(user._id.toString(), "g-new");

        await expect(assertValidMobileAccessToken(token!)).rejects.toThrow(AuthError);
    });

    it("revokes a single refresh token on logout", async () => {
        const user = await makeUser();
        const { refreshToken } = await issueMobileAuthBody(user);

        await revokeMobileRefreshToken(refreshToken);

        await expect(getUserByMobileRefreshToken(refreshToken)).rejects.toThrow(AuthError);
    });

    it("logout is idempotent for an unknown refresh token", async () => {
        await expect(revokeMobileRefreshToken("does-not-exist")).resolves.toBeUndefined();
    });
});
