import { describe, it, expect, vi } from "vitest";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withRateLimit } from "./withRateLimit";
import { RateLimitError } from "./errorHandling";

describe("withRateLimit", () => {
    const mockReq = {} as NextRequest;
    const mockContext = { userId: "user-123" };
    const mockHandler = vi
        .fn()
        .mockImplementation(() => Promise.resolve(NextResponse.json({ ok: true })));

    it("should pass through when limiter is null", async () => {
        const wrapped = withRateLimit(null, mockHandler);
        const res = await wrapped(mockReq, mockContext);
        const body = await res.json();

        expect(body).toEqual({ ok: true });
        expect(mockHandler).toHaveBeenCalledWith(mockReq, mockContext);
    });

    it("should call handler when rate limit is not exceeded", async () => {
        const limiter = {
            limit: vi.fn().mockResolvedValue({ success: true, reset: Date.now() + 60000 }),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wrapped = withRateLimit(limiter as any, mockHandler);
        const res = await wrapped(mockReq, mockContext);
        const body = await res.json();

        expect(limiter.limit).toHaveBeenCalledWith("user-123");
        expect(body).toEqual({ ok: true });
    });

    it("should throw RateLimitError when rate limit is exceeded", async () => {
        const resetTime = Date.now() + 30000;
        const limiter = {
            limit: vi.fn().mockResolvedValue({ success: false, reset: resetTime }),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wrapped = withRateLimit(limiter as any, mockHandler);

        await expect(wrapped(mockReq, mockContext)).rejects.toThrow(RateLimitError);
        await expect(wrapped(mockReq, mockContext)).rejects.toMatchObject({
            status: 429,
            retryAfter: expect.any(Number),
        });
    });

    it("should return retryAfter of at least 1 second", async () => {
        const limiter = {
            limit: vi.fn().mockResolvedValue({ success: false, reset: Date.now() - 1000 }),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wrapped = withRateLimit(limiter as any, mockHandler);

        try {
            await wrapped(mockReq, mockContext);
        } catch (error) {
            expect(error).toBeInstanceOf(RateLimitError);
            expect((error as RateLimitError).retryAfter).toBeGreaterThanOrEqual(1);
        }
    });
});
