import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

vi.mock("next-auth/jwt", () => ({
    getToken: vi.fn(),
}));

import { withAuth } from "./withAuth";
import { getToken } from "next-auth/jwt";
import { AuthError } from "./errorHandling";

const mockReq = {} as NextRequest;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("withAuth", () => {
    it("should pass userId to handler when token is valid", async () => {
        (getToken as Mock).mockResolvedValue({ userId: "user-123" });
        const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));

        const wrapped = withAuth(handler);
        await wrapped(mockReq, {});

        expect(handler).toHaveBeenCalledWith(mockReq, { userId: "user-123" });
    });

    it("should throw AuthError when no token", async () => {
        (getToken as Mock).mockResolvedValue(null);
        const handler = vi.fn();

        const wrapped = withAuth(handler);

        await expect(wrapped(mockReq, {})).rejects.toThrow(AuthError);
        expect(handler).not.toHaveBeenCalled();
    });

    it("should throw AuthError when token has no userId", async () => {
        (getToken as Mock).mockResolvedValue({ sub: "some-sub" });
        const handler = vi.fn();

        const wrapped = withAuth(handler);

        await expect(wrapped(mockReq, {})).rejects.toThrow(AuthError);
    });

    it("should convert userId to string", async () => {
        // Simulate an ObjectId-like value with toString
        const objectIdLike = { toString: () => "obj-id-str" };
        (getToken as Mock).mockResolvedValue({ userId: objectIdLike });
        const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));

        const wrapped = withAuth(handler);
        await wrapped(mockReq, {});

        expect(handler).toHaveBeenCalledWith(mockReq, { userId: "obj-id-str" });
    });
});
