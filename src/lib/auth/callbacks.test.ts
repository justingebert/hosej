import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { JWT } from "next-auth/jwt";
import type { Account, User as NextAuthUser } from "next-auth";
import { Types } from "mongoose";

vi.mock("@/db/dbConnect", () => ({ default: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/db/models/User", () => {
    // Constructor that copies data onto `this` (supports `new User({...})`)
    function MockUser(this: Record<string, unknown>, data: Record<string, unknown>) {
        Object.assign(this, data);
    }
    MockUser.findOne = vi.fn();
    MockUser.findById = vi.fn();
    return { default: MockUser };
});

// `cookies()` is read by jwtCallback for the Google connect flow — default to
// an empty cookie jar; individual tests override via `setCookieToken()`.
const cookieStore = {
    get: vi.fn(() => undefined as { value: string } | undefined),
    delete: vi.fn(),
};
vi.mock("next/headers", () => ({
    cookies: vi.fn(async () => cookieStore),
}));

function setCookieToken(value: string | undefined) {
    cookieStore.get.mockImplementation(() => (value ? { value } : undefined));
}

import { authorizeDevice, jwtCallback, sessionCallback } from "./callbacks";
import User from "@/db/models/User";

const mockId = new Types.ObjectId();

function baseToken(overrides: Partial<JWT> = {}): JWT {
    return {
        sub: "sub",
        userId: "",
        username: "",
        googleConnected: false,
        groups: [],
        createdAt: "",
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    setCookieToken(undefined);
});

// ---------- authorizeDevice ----------

describe("authorizeDevice", () => {
    it("should return user with id field for valid deviceId", async () => {
        const userDoc = {
            _id: mockId,
            username: "alice",
            deviceId: "dev-1",
            groups: [],
            googleConnected: false,
        };
        (User.findOne as Mock).mockReturnValue({ lean: vi.fn().mockResolvedValue(userDoc) });

        const result = await authorizeDevice({ deviceId: "dev-1" });

        expect(result).toMatchObject({ id: mockId.toString(), username: "alice" });
    });

    it("should return null when deviceId is missing", async () => {
        const result = await authorizeDevice(undefined);
        expect(result).toBeNull();
    });

    it("should return null when deviceId is empty", async () => {
        const result = await authorizeDevice({ deviceId: "" });
        expect(result).toBeNull();
    });

    it("should return null when user not found", async () => {
        (User.findOne as Mock).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

        const result = await authorizeDevice({ deviceId: "unknown" });
        expect(result).toBeNull();
    });
});

// ---------- jwtCallback ----------

describe("jwtCallback", () => {
    it("should create new user on Google sign-in when user does not exist", async () => {
        (User.findOne as Mock).mockResolvedValue(null);

        // Set prototype defaults so `new User(data)` instances have _id, save, createdAt
        const saveFn = vi.fn().mockResolvedValue(undefined);
        const proto = (User as unknown as { prototype: Record<string, unknown> }).prototype;
        proto._id = mockId;
        proto.save = saveFn;
        proto.createdAt = "2024-01-01";

        const token = baseToken();
        const account = { provider: "google", providerAccountId: "g-123" } as Account;
        const user = { name: "New User" } as NextAuthUser;

        const result = await jwtCallback({ token, user, account, trigger: "signIn" });

        expect(saveFn).toHaveBeenCalled();
        expect(result.userId).toBe(mockId.toString());
        expect(result.username).toBe("New User");
        expect(result.googleConnected).toBe(true);
        expect(result.groups).toEqual([]);
    });

    it("should merge Google account into device user when cookie token matches", async () => {
        const deviceUserSave = vi.fn().mockResolvedValue(undefined);
        const deviceUser = {
            _id: mockId,
            username: "alice",
            groups: ["group-1"],
            createdAt: "2024-01-01",
            deviceId: "dev-1",
            connectToken: "tok-valid",
            connectTokenExpiresAt: new Date(Date.now() + 60_000),
            googleId: undefined as string | undefined,
            googleConnected: false,
            save: deviceUserSave,
        };

        (User.findOne as Mock)
            .mockResolvedValueOnce(null) // googleId lookup
            .mockResolvedValueOnce(deviceUser); // connectToken lookup

        setCookieToken("tok-valid");

        const token = baseToken();
        const account = { provider: "google", providerAccountId: "g-abc" } as Account;

        const result = await jwtCallback({ token, account, trigger: "signIn" });

        // The connectToken lookup must be scoped to the exact cookie value —
        // not a generic "any unexpired token" match.
        expect((User.findOne as Mock).mock.calls[1][0]).toMatchObject({
            connectToken: "tok-valid",
        });

        expect(deviceUser.googleId).toBe("g-abc");
        expect(deviceUser.googleConnected).toBe(true);
        expect(deviceUser.deviceId).toBeUndefined();
        expect(deviceUser.connectToken).toBeUndefined();
        expect(deviceUserSave).toHaveBeenCalled();
        expect(cookieStore.delete).toHaveBeenCalledWith("hosej_connect_token");

        expect(result.userId).toBe(mockId.toString());
        expect(result.username).toBe("alice");
        expect(result.googleConnected).toBe(true);
        expect(result.needsNameSetup).toBe(false);
    });

    it("should NOT merge into any device user when cookie is missing", async () => {
        // Regression guard for the hijack vector: even if some other user has
        // an unexpired connectToken, a Google sign-in without a matching cookie
        // must fall through to fresh-signup and never look up by token.
        (User.findOne as Mock).mockResolvedValue(null);

        const saveFn = vi.fn().mockResolvedValue(undefined);
        const proto = (User as unknown as { prototype: Record<string, unknown> }).prototype;
        proto._id = mockId;
        proto.save = saveFn;
        proto.createdAt = "2024-01-01";

        const token = baseToken();
        const account = { provider: "google", providerAccountId: "g-xyz" } as Account;
        const user = { name: "Attacker" } as NextAuthUser;

        const result = await jwtCallback({ token, user, account, trigger: "signIn" });

        // Only the googleId lookup should have run — no connectToken query.
        expect(User.findOne as Mock).toHaveBeenCalledTimes(1);
        expect((User.findOne as Mock).mock.calls[0][0]).toEqual({ googleId: "g-xyz" });

        // Fresh-signup path: a new user is created, no device user is touched.
        expect(saveFn).toHaveBeenCalled();
        expect(result.needsNameSetup).toBe(true);
    });

    it("should NOT merge when cookie token does not match any user", async () => {
        // googleId lookup → null, then connectToken lookup → null (no match)
        (User.findOne as Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

        const saveFn = vi.fn().mockResolvedValue(undefined);
        const proto = (User as unknown as { prototype: Record<string, unknown> }).prototype;
        proto._id = mockId;
        proto.save = saveFn;
        proto.createdAt = "2024-01-01";

        setCookieToken("tok-bogus");

        const token = baseToken();
        const account = { provider: "google", providerAccountId: "g-xyz" } as Account;
        const user = { name: "Attacker" } as NextAuthUser;

        const result = await jwtCallback({ token, user, account, trigger: "signIn" });

        expect((User.findOne as Mock).mock.calls[1][0]).toMatchObject({
            connectToken: "tok-bogus",
        });
        expect(saveFn).toHaveBeenCalled();
        expect(result.needsNameSetup).toBe(true);
    });

    it("should populate token from existing user on Google sign-in", async () => {
        const existingUser = {
            _id: mockId,
            username: "existing",
            googleConnected: true,
            groups: ["group-1"],
            createdAt: "2024-01-01",
        };
        (User.findOne as Mock).mockResolvedValue(existingUser);

        const token = baseToken();
        const account = { provider: "google", providerAccountId: "g-123" } as Account;

        const result = await jwtCallback({ token, account, trigger: "signIn" });

        expect(result.userId).toBe(mockId.toString());
        expect(result.username).toBe("existing");
        expect(result.groups).toEqual(["group-1"]);
    });

    it("should populate token from user object on device credentials sign-in", async () => {
        const token = baseToken();
        const user = {
            _id: mockId,
            id: mockId.toString(),
            username: "device-user",
            googleConnected: false,
            groups: ["g1"],
            createdAt: "2024-06-01",
        } as unknown as NextAuthUser;

        const result = await jwtCallback({ token, user, trigger: "signIn" });

        expect(result.userId).toBe(mockId.toString());
        expect(result.username).toBe("device-user");
        expect(result.googleConnected).toBe(false);
        expect(result.groups).toEqual(["g1"]);
    });

    it("should refresh token from DB on update trigger", async () => {
        const freshUser = {
            username: "updated-name",
            googleConnected: true,
            groups: ["g2"],
            createdAt: "2024-07-01",
        };
        (User.findById as Mock).mockReturnValue({
            select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(freshUser) }),
        });

        const token = baseToken({ userId: mockId.toString(), username: "old-name" });

        const result = await jwtCallback({ token, trigger: "update" });

        expect(result.username).toBe("updated-name");
        expect(result.googleConnected).toBe(true);
        expect(result.groups).toEqual(["g2"]);
    });

    it("should leave token unchanged on update trigger when user deleted", async () => {
        (User.findById as Mock).mockReturnValue({
            select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
        });

        const token = baseToken({ userId: mockId.toString(), username: "old-name" });

        const result = await jwtCallback({ token, trigger: "update" });

        expect(result.username).toBe("old-name");
    });

    it("should return token as-is when no sign-in or update", async () => {
        const token = baseToken({ userId: "abc", username: "test" });

        const result = await jwtCallback({ token });

        expect(result).toEqual(token);
    });
});

// ---------- sessionCallback ----------

describe("sessionCallback", () => {
    it("should build session.user from token fields", async () => {
        const token = baseToken({
            userId: "user-123",
            username: "alice",
            googleConnected: true,
            groups: ["g1"],
            createdAt: "2024-01-01",
        });
        const session = { expires: "2099-01-01", user: {} } as Parameters<
            typeof sessionCallback
        >[0]["session"];

        const result = await sessionCallback({ session, token });

        expect(result.userId).toBe("user-123");
        expect(result.user).toEqual({
            _id: "user-123",
            username: "alice",
            googleConnected: true,
            groups: ["g1"],
            createdAt: "2024-01-01",
            needsNameSetup: undefined,
            onboardingCompleted: undefined,
            announcementsSeen: [],
        });
    });
});
