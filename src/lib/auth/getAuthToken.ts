import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { env } from "@/env";
import { decodeMobileToken } from "@/lib/auth/mobileToken";

export type AuthTokenSource = "mobile" | "cookie";
export type AuthTokenResolution = { token: JWT; source: AuthTokenSource };

/**
 * Resolve the auth token from either a mobile `Authorization: Bearer <token>`
 * header (Expo) or the NextAuth session cookie (browser). Returns null when
 * neither yields a valid, unexpired token. Used by both `withAuth` (API routes)
 * and `proxy.ts` so the two auth surfaces accept the same credentials.
 */
export async function resolveAuthToken(
    req: NextRequest,
    { allowBearer = true }: { allowBearer?: boolean } = {}
): Promise<AuthTokenResolution | null> {
    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    if (allowBearer && bearer) {
        const token = await decodeMobileToken(bearer);
        return token ? { token, source: "mobile" } : null;
    }

    const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });
    return token ? { token, source: "cookie" } : null;
}

export async function getAuthToken(
    req: NextRequest,
    options: { allowBearer?: boolean } = {}
): Promise<JWT | null> {
    return (await resolveAuthToken(req, options))?.token ?? null;
}
