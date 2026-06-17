// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import {
    mintMobileToken,
    decodeMobileToken,
    userTokenClaims,
    authUserSummary,
    buildMobileAuthBody,
} from "./mobileToken";

// NEXTAUTH_SECRET is stubbed by globalSetup; no DB needed for these.

describe("mobileToken", () => {
    it("mints a token that decodes back to the same claims", async () => {
        const _id = new Types.ObjectId();
        const groups = [new Types.ObjectId(), new Types.ObjectId()];
        const claims = userTokenClaims({
            _id,
            username: "alice",
            googleConnected: true,
            groups,
            createdAt: new Date("2024-01-01"),
        });

        const token = await mintMobileToken(claims);
        const decoded = await decodeMobileToken(token);

        expect(decoded?.userId).toBe(_id.toString());
        expect(decoded?.username).toBe("alice");
        expect(decoded?.googleConnected).toBe(true);
        expect(decoded?.groups).toEqual(groups.map(String));
        expect(decoded?.needsNameSetup).toBe(false);
    });

    it("returns null for a malformed token", async () => {
        expect(await decodeMobileToken("not-a-real-token")).toBeNull();
    });

    it("authUserSummary exposes id, username and googleConnected", () => {
        const _id = new Types.ObjectId();
        const summary = authUserSummary({ _id, username: "bob", googleConnected: true });

        expect(summary).toEqual({ id: _id.toString(), username: "bob", googleConnected: true });
    });

    it("buildMobileAuthBody carries the token and the needsNameSetup hint", async () => {
        const body = await buildMobileAuthBody(
            { _id: new Types.ObjectId(), username: "x" },
            { refreshToken: "refresh-token", needsNameSetup: true }
        );

        expect(typeof body.accessToken).toBe("string");
        expect(body.refreshToken).toBe("refresh-token");
        expect(body.needsNameSetup).toBe(true);
        expect(body.user.username).toBe("x");
    });
});
