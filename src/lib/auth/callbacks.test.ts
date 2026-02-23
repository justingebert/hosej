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
        });
    });
});
