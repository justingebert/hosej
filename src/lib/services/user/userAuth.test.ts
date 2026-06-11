import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser } from "@/test/factories";
import { getUserByDeviceId, findOrCreateGoogleUser, linkGoogleToUser } from "./user";
import { NotFoundError, ConflictError } from "@/lib/api/errorHandling";
import User from "@/db/models/User";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("getUserByDeviceId", () => {
    it("returns the user for a known deviceId", async () => {
        await makeUser({ deviceId: "dev-1", username: "bob" });

        const user = await getUserByDeviceId("dev-1");

        expect(user.username).toBe("bob");
    });

    it("throws NotFoundError for an unknown deviceId", async () => {
        await expect(getUserByDeviceId("nope")).rejects.toThrow(NotFoundError);
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
        const device = await makeUser({ deviceId: "dev-1", username: "carol" });

        const user = await linkGoogleToUser(device._id.toString(), "g-9");

        expect(user.googleId).toBe("g-9");
        expect(user.googleConnected).toBe(true);
        expect(user.deviceId).toBeUndefined();
    });

    it("throws ConflictError when the google account belongs to another user", async () => {
        await makeUser({ googleId: "g-taken" });
        const device = await makeUser({ deviceId: "dev-2" });

        await expect(linkGoogleToUser(device._id.toString(), "g-taken")).rejects.toThrow(
            ConflictError
        );
    });

    it("is idempotent when re-linking the same google id to the same user", async () => {
        const device = await makeUser({ deviceId: "dev-3" });
        await linkGoogleToUser(device._id.toString(), "g-self");

        const again = await linkGoogleToUser(device._id.toString(), "g-self");

        expect(again.googleId).toBe("g-self");
    });
});
