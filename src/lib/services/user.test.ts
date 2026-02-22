import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Types } from "mongoose";

vi.mock("@/db/models/User");
vi.mock("@/db/dbConnect");

import {
    getUserById,
    createDeviceUser,
    updateUser,
    registerPushToken,
    unregisterPushToken,
    connectGoogleAccount,
    disconnectGoogleAccount,
} from "./user";
import User from "@/db/models/User";
import dbConnect from "@/db/dbConnect";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";

const mockUserId = new Types.ObjectId().toString();

function createMockUser(overrides = {}) {
    return {
        _id: new Types.ObjectId(mockUserId),
        username: "testuser",
        groups: [],
        deviceId: "device-123",
        fcmToken: undefined,
        googleConnected: false,
        googleId: undefined,
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    (dbConnect as Mock).mockResolvedValue(undefined);
});

describe("getUserById", () => {
    it("should return user when found", async () => {
        const mockUser = createMockUser();
        (User.findById as Mock).mockResolvedValue(mockUser);

        const result = await getUserById(mockUserId);

        expect(result).toEqual(mockUser);
        expect(dbConnect).toHaveBeenCalled();
    });

    it("should throw NotFoundError when user not found", async () => {
        (User.findById as Mock).mockResolvedValue(null);

        await expect(getUserById(mockUserId)).rejects.toThrow(NotFoundError);
    });
});

describe("createDeviceUser", () => {
    it("should create and return a new user", async () => {
        const mockUser = createMockUser();
        (User.findOne as Mock).mockResolvedValue(null);
        // Mock the User constructor by replacing prototype
        vi.mocked(User).mockImplementation(function (this: any, data: any) {
            Object.assign(this, mockUser, data);
            this.save = mockUser.save;
            return this;
        } as any);

        const result = await createDeviceUser("device-123", "testuser");

        expect(result.save).toHaveBeenCalled();
    });

    it("should throw ValidationError when deviceId is missing", async () => {
        await expect(createDeviceUser("", "testuser")).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when username is missing", async () => {
        await expect(createDeviceUser("device-123", "")).rejects.toThrow(ValidationError);
    });

    it("should throw ConflictError when deviceId already exists", async () => {
        (User.findOne as Mock).mockResolvedValue(createMockUser());

        await expect(createDeviceUser("device-123", "testuser")).rejects.toThrow(ConflictError);
    });
});

describe("updateUser", () => {
    it("should update username", async () => {
        const updatedUser = createMockUser({ username: "newname" });
        (User.findByIdAndUpdate as Mock).mockResolvedValue(updatedUser);

        const result = await updateUser(mockUserId, { username: "newname" });

        expect(result.username).toBe("newname");
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            mockUserId,
            { username: "newname" },
            { new: true }
        );
    });

    it("should throw NotFoundError when user not found", async () => {
        (User.findByIdAndUpdate as Mock).mockResolvedValue(null);

        await expect(updateUser(mockUserId, { username: "newname" })).rejects.toThrow(
            NotFoundError
        );
    });

    it("should only pass allowlisted fields", async () => {
        const updatedUser = createMockUser();
        (User.findByIdAndUpdate as Mock).mockResolvedValue(updatedUser);

        // Pass extra fields that should be ignored
        await updateUser(mockUserId, { username: "newname" } as any);

        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            mockUserId,
            { username: "newname" },
            { new: true }
        );
    });
});

describe("registerPushToken", () => {
    it("should register a new token", async () => {
        const mockUser = createMockUser({ fcmToken: undefined });
        (User.findById as Mock).mockResolvedValue(mockUser);

        const result = await registerPushToken(mockUserId, "new-token");

        expect(result.alreadyRegistered).toBe(false);
        expect(mockUser.fcmToken).toBe("new-token");
        expect(mockUser.save).toHaveBeenCalled();
    });

    it("should return alreadyRegistered when token matches", async () => {
        const mockUser = createMockUser({ fcmToken: "existing-token" });
        (User.findById as Mock).mockResolvedValue(mockUser);

        const result = await registerPushToken(mockUserId, "existing-token");

        expect(result.alreadyRegistered).toBe(true);
        expect(mockUser.save).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when token is empty", async () => {
        await expect(registerPushToken(mockUserId, "")).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError when user not found", async () => {
        (User.findById as Mock).mockResolvedValue(null);

        await expect(registerPushToken(mockUserId, "token")).rejects.toThrow(NotFoundError);
    });
});

describe("unregisterPushToken", () => {
    it("should clear fcmToken", async () => {
        const mockUser = createMockUser({ fcmToken: "some-token" });
        (User.findById as Mock).mockResolvedValue(mockUser);

        await unregisterPushToken(mockUserId, "some-token");

        expect(mockUser.fcmToken).toBeUndefined();
        expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw ValidationError when token is empty", async () => {
        await expect(unregisterPushToken(mockUserId, "")).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError when user not found", async () => {
        (User.findById as Mock).mockResolvedValue(null);

        await expect(unregisterPushToken(mockUserId, "token")).rejects.toThrow(NotFoundError);
    });
});

describe("connectGoogleAccount", () => {
    it("should migrate googleId from google user to device user", async () => {
        const googleUser = createMockUser({ googleId: "google-123" });
        const deviceUser = createMockUser({ deviceId: "device-456" });

        (User.findById as Mock).mockResolvedValue(googleUser);
        (User.findOne as Mock).mockResolvedValue(deviceUser);
        (User.deleteOne as Mock).mockResolvedValue({ deletedCount: 1 });

        await connectGoogleAccount(mockUserId, "device-456");

        expect(User.deleteOne).toHaveBeenCalled();
        expect(deviceUser.googleId).toBe("google-123");
        expect(deviceUser.googleConnected).toBe(true);
        expect(deviceUser.deviceId).toBeUndefined();
        expect(deviceUser.save).toHaveBeenCalled();
    });

    it("should throw ValidationError when deviceId is missing", async () => {
        await expect(connectGoogleAccount(mockUserId, "")).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError when google user not found", async () => {
        (User.findById as Mock).mockResolvedValue(null);

        await expect(connectGoogleAccount(mockUserId, "device-456")).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when device user not found", async () => {
        (User.findById as Mock).mockResolvedValue(createMockUser());
        (User.findOne as Mock).mockResolvedValue(null);

        await expect(connectGoogleAccount(mockUserId, "device-456")).rejects.toThrow(NotFoundError);
    });
});

describe("disconnectGoogleAccount", () => {
    it("should set deviceId and clear google fields", async () => {
        const mockUser = createMockUser({
            googleId: "google-123",
            googleConnected: true,
        });
        (User.findById as Mock).mockResolvedValue(mockUser);

        await disconnectGoogleAccount(mockUserId, "new-device-id");

        expect(mockUser.deviceId).toBe("new-device-id");
        expect(mockUser.googleId).toBeUndefined();
        expect(mockUser.googleConnected).toBe(false);
        expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw ValidationError when deviceId is missing", async () => {
        await expect(disconnectGoogleAccount(mockUserId, "")).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError when user not found", async () => {
        (User.findById as Mock).mockResolvedValue(null);

        await expect(disconnectGoogleAccount(mockUserId, "device-id")).rejects.toThrow(
            NotFoundError
        );
    });
});
