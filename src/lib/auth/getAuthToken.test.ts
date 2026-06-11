// @vitest-environment node
import { describe, it, expect } from "vitest";
import type { NextRequest } from "next/server";
import { Types } from "mongoose";
import { getAuthToken } from "./getAuthToken";
import { mintMobileToken, userTokenClaims } from "./mobileToken";

function reqWithAuth(header: string | null): NextRequest {
    return {
        headers: { get: (k: string) => (k.toLowerCase() === "authorization" ? header : null) },
    } as unknown as NextRequest;
}

describe("getAuthToken — Bearer path", () => {
    it("decodes a valid mobile Bearer token to its claims", async () => {
        const _id = new Types.ObjectId();
        const token = await mintMobileToken(
            userTokenClaims({ _id, username: "alice", groups: [] })
        );

        const result = await getAuthToken(reqWithAuth(`Bearer ${token}`));

        expect(result?.userId).toBe(_id.toString());
        expect(result?.username).toBe("alice");
    });

    it("returns null for a malformed Bearer token", async () => {
        expect(await getAuthToken(reqWithAuth("Bearer garbage.token"))).toBeNull();
    });

    it("returns null for an empty Bearer value", async () => {
        expect(await getAuthToken(reqWithAuth("Bearer "))).toBeNull();
    });
});
