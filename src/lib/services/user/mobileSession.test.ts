// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser } from "@/test/factories";
import User from "@/db/models/User";
import { AuthError } from "@/lib/api/errorHandling";
import { decodeMobileToken, hashMobileRefreshToken } from "@/lib/auth/mobileToken";
import { assertValidMobileAccessToken, issueMobileAuthBody, refreshMobileAuthBody } from "./user";
import {
    MAX_MOBILE_SESSIONS_PER_USER,
    revokeAllMobileSessions,
    revokeMobileSession,
} from "./mobileSession";

const DEVICE_ID_A = "11111111-1111-4111-8111-111111111111";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

async function expectAccessAccepted(accessToken: string) {
    const claims = await decodeMobileToken(accessToken);
    expect(claims).not.toBeNull();
    await expect(assertValidMobileAccessToken(claims!)).resolves.toBeUndefined();
}

async function expectAccessRejected(accessToken: string) {
    const claims = await decodeMobileToken(accessToken);
    expect(claims).not.toBeNull();
    await expect(assertValidMobileAccessToken(claims!)).rejects.toThrow(AuthError);
}

/** Rewrite a stored session's timestamps, bypassing mongoose defaults. */
async function backdateSession(userId: unknown, tokenHash: string, fields: Record<string, Date>) {
    const setters = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [`mobileRefreshTokens.$.${key}`, value])
    );
    await User.collection.updateOne(
        { _id: userId as never, "mobileRefreshTokens.tokenHash": tokenHash },
        { $set: setters }
    );
}

describe("refreshing a session", () => {
    it("returns the same refresh token and a working access token", async () => {
        const user = await makeUser();
        const signIn = await issueMobileAuthBody(user);

        const refreshed = await refreshMobileAuthBody(signIn.refreshToken);

        expect(refreshed.refreshToken).toBe(signIn.refreshToken);
        expect(refreshed.accessToken).not.toBe(signIn.accessToken);
        await expectAccessAccepted(refreshed.accessToken);
    });

    it("stores the token hashed, never the token itself", async () => {
        const user = await makeUser();
        const { refreshToken } = await issueMobileAuthBody(user);

        const stored = await User.findById(user._id);
        expect(stored?.mobileRefreshTokens).toHaveLength(1);
        expect(stored?.mobileRefreshTokens?.[0].tokenHash).toBe(
            hashMobileRefreshToken(refreshToken)
        );
        expect(stored?.mobileRefreshTokens?.[0].tokenHash).not.toBe(refreshToken);
    });

    // The logout bug: under rotation, a lost response left the client holding a
    // spent token. Presenting the same token again must simply work, every time.
    it("is idempotent across repeated use", async () => {
        const user = await makeUser();
        const { refreshToken } = await issueMobileAuthBody(user);

        for (let i = 0; i < 5; i++) {
            const body = await refreshMobileAuthBody(refreshToken);
            expect(body.refreshToken).toBe(refreshToken);
        }

        await expectAccessAccepted((await refreshMobileAuthBody(refreshToken)).accessToken);
    });

    // Rotation rewrote the whole array on every refresh, so overlapping refreshes
    // dropped each other's new credential.
    it("survives concurrent refreshes of the same token", async () => {
        const user = await makeUser();
        const { refreshToken } = await issueMobileAuthBody(user);

        const bodies = await Promise.all(
            Array.from({ length: 8 }, () => refreshMobileAuthBody(refreshToken))
        );

        expect(bodies.every((body) => body.refreshToken === refreshToken)).toBe(true);
        const stored = await User.findById(user._id);
        expect(stored?.mobileRefreshTokens).toHaveLength(1);
        await expectAccessAccepted(bodies.at(-1)!.accessToken);
    });

    // The other lost update: two devices signing in at once both wrote the array.
    it("keeps every session when two devices sign in concurrently", async () => {
        const user = await makeUser();

        const [first, second] = await Promise.all([
            issueMobileAuthBody(user),
            issueMobileAuthBody(user),
        ]);

        const stored = await User.findById(user._id);
        expect(stored?.mobileRefreshTokens).toHaveLength(2);
        await expect(refreshMobileAuthBody(first.refreshToken)).resolves.toBeDefined();
        await expect(refreshMobileAuthBody(second.refreshToken)).resolves.toBeDefined();
    });

    it("rejects an unknown token", async () => {
        await expect(refreshMobileAuthBody("never-issued")).rejects.toThrow(AuthError);
    });

    it("carries the needsNameSetup hint while the placeholder name is unchanged", async () => {
        const user = await makeUser({ username: "New user" });
        const { refreshToken } = await issueMobileAuthBody(user);

        expect((await refreshMobileAuthBody(refreshToken)).needsNameSetup).toBe(true);

        await User.updateOne({ _id: user._id }, { $set: { username: "Alice" } });
        expect((await refreshMobileAuthBody(refreshToken)).needsNameSetup).toBe(false);
    });
});

describe("session expiry", () => {
    it("rejects a session past its absolute cap", async () => {
        const user = await makeUser();
        const { refreshToken, accessToken } = await issueMobileAuthBody(user);

        await backdateSession(user._id, hashMobileRefreshToken(refreshToken), {
            expiresAt: new Date(Date.now() - 1000),
        });

        await expect(refreshMobileAuthBody(refreshToken)).rejects.toThrow(AuthError);
        await expectAccessRejected(accessToken);
    });

    // Refreshing is a pure read, so it must not extend the session either.
    it("does not extend a session by refreshing it", async () => {
        const user = await makeUser();
        const { refreshToken } = await issueMobileAuthBody(user);
        const expiresAt = new Date(Date.now() + 60_000);

        await backdateSession(user._id, hashMobileRefreshToken(refreshToken), { expiresAt });
        await refreshMobileAuthBody(refreshToken);

        const stored = await User.findById(user._id);
        expect(stored?.mobileRefreshTokens?.[0].expiresAt).toEqual(expiresAt);
    });
});

describe("revocation", () => {
    it("signs out one device without touching the others", async () => {
        const user = await makeUser();
        const phone = await issueMobileAuthBody(user);
        const tablet = await issueMobileAuthBody(user);

        await revokeMobileSession(phone.refreshToken);

        await expect(refreshMobileAuthBody(phone.refreshToken)).rejects.toThrow(AuthError);
        await expect(refreshMobileAuthBody(tablet.refreshToken)).resolves.toBeDefined();
        await expectAccessAccepted(tablet.accessToken);
    });

    // Every request revalidates the session, so revoking kills the access token
    // on the next request rather than whenever it happened to expire.
    it("kills the revoked device's access token immediately", async () => {
        const user = await makeUser();
        const { refreshToken, accessToken } = await issueMobileAuthBody(user);
        await expectAccessAccepted(accessToken);

        await revokeMobileSession(refreshToken);

        await expectAccessRejected(accessToken);
    });

    it("is idempotent and silent for an unknown token", async () => {
        await expect(revokeMobileSession("never-issued")).resolves.toBeUndefined();
        await expect(revokeMobileSession("never-issued")).resolves.toBeUndefined();
    });

    it("signs out every device when the account's credentials change", async () => {
        const user = await makeUser({ deviceId: DEVICE_ID_A });
        const phone = await issueMobileAuthBody(user);
        const tablet = await issueMobileAuthBody(user);

        await revokeAllMobileSessions(user._id);

        await expectAccessRejected(phone.accessToken);
        await expectAccessRejected(tablet.accessToken);
        await expect(refreshMobileAuthBody(tablet.refreshToken)).rejects.toThrow(AuthError);
    });

    it("rejects sessions belonging to a deleted user", async () => {
        const user = await makeUser();
        const { refreshToken, accessToken } = await issueMobileAuthBody(user);

        await User.updateOne({ _id: user._id }, { $set: { deletedAt: new Date() } });

        await expect(refreshMobileAuthBody(refreshToken)).rejects.toThrow(AuthError);
        await expectAccessRejected(accessToken);
    });

    it("will not accept another user's session id for this user", async () => {
        const alice = await makeUser();
        const bob = await makeUser();
        const aliceSignIn = await issueMobileAuthBody(alice);
        const bobSignIn = await issueMobileAuthBody(bob);

        const aliceClaims = await decodeMobileToken(aliceSignIn.accessToken);
        const bobClaims = await decodeMobileToken(bobSignIn.accessToken);
        const forged = { ...bobClaims!, sessionId: aliceClaims!.sessionId };

        await expect(assertValidMobileAccessToken(forged)).rejects.toThrow(AuthError);
    });
});

describe("device cap", () => {
    it("drops the oldest session past the cap and keeps the rest", async () => {
        const user = await makeUser();
        const sessions = [];
        for (let i = 0; i <= MAX_MOBILE_SESSIONS_PER_USER; i++) {
            sessions.push(await issueMobileAuthBody(user));
        }

        const stored = await User.findById(user._id);
        expect(stored?.mobileRefreshTokens).toHaveLength(MAX_MOBILE_SESSIONS_PER_USER);
        await expect(refreshMobileAuthBody(sessions.at(-1)!.refreshToken)).resolves.toBeDefined();

        // Exactly one sign-in was evicted, not several.
        const results = await Promise.allSettled(
            sessions.map((session) => refreshMobileAuthBody(session.refreshToken))
        );
        expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    });
});

// Tokens already on users' devices must keep working — a deploy that logs
// everyone out would be the very bug this replaces.
describe("tokens issued by the previous rotating scheme", () => {
    async function seedLegacyToken(
        userId: unknown,
        refreshToken: string,
        extra: Record<string, unknown> = {}
    ) {
        await User.collection.updateOne(
            { _id: userId as never },
            {
                $set: {
                    mobileRefreshTokens: [
                        {
                            tokenHash: hashMobileRefreshToken(refreshToken),
                            createdAt: new Date(),
                            expiresAt: new Date(Date.now() + 86_400_000),
                            ...extra,
                        },
                    ],
                },
            }
        );
    }

    // A faithful pre-deploy document: the retired version counter, one live token
    // and the tombstone it replaced. This is what the deploy actually lands on.
    it("carries a real pre-deploy document through a refresh", async () => {
        const user = await makeUser();
        await User.collection.updateOne(
            { _id: user._id as never },
            {
                $set: {
                    mobileSessionVersion: 7,
                    mobileRefreshTokens: [
                        {
                            tokenHash: hashMobileRefreshToken("spent-token"),
                            createdAt: new Date(Date.now() - 172_800_000),
                            expiresAt: new Date(Date.now() + 86_400_000),
                            consumedAt: new Date(Date.now() - 86_400_000),
                            replacedByHash: hashMobileRefreshToken("live-token"),
                        },
                        {
                            tokenHash: hashMobileRefreshToken("live-token"),
                            createdAt: new Date(Date.now() - 86_400_000),
                            expiresAt: new Date(Date.now() + 86_400_000),
                        },
                    ],
                },
            }
        );

        const body = await refreshMobileAuthBody("live-token");

        expect(body.refreshToken).toBe("live-token");
        await expectAccessAccepted(body.accessToken);
        // The client stranded on the spent token by a lost response recovers too.
        await expect(refreshMobileAuthBody("spent-token")).resolves.toBeDefined();
    });

    it("refreshes a token issued before the change", async () => {
        const user = await makeUser();
        await seedLegacyToken(user._id, "legacy-token");

        const body = await refreshMobileAuthBody("legacy-token");

        expect(body.refreshToken).toBe("legacy-token");
        await expectAccessAccepted(body.accessToken);
    });

    it("ignores the retired tombstone fields", async () => {
        const user = await makeUser();
        await seedLegacyToken(user._id, "legacy-token", {
            consumedAt: new Date(),
            replacedByHash: "some-successor",
        });

        await expect(refreshMobileAuthBody("legacy-token")).resolves.toBeDefined();
    });

    it("still honours the original expiry", async () => {
        const user = await makeUser();
        await seedLegacyToken(user._id, "legacy-token", {
            expiresAt: new Date(Date.now() - 1000),
        });

        await expect(refreshMobileAuthBody("legacy-token")).rejects.toThrow(AuthError);
    });
});
