import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { env } from "@/env";
import { decodeMobileToken } from "@/lib/auth/mobileToken";

/**
 * Resolve the auth token from either a mobile `Authorization: Bearer <token>`
 * header (Expo) or the NextAuth session cookie (browser). Returns null when
 * neither yields a valid, unexpired token. Used by both `withAuth` (API routes)
 * and `proxy.ts` so the two auth surfaces accept the same credentials.
 */
export async function getAuthToken(req: NextRequest): Promise<JWT | null> {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const raw = authHeader.slice("Bearer ".length).trim();
        return raw ? decodeMobileToken(raw) : null;
    }
    return getToken({ req, secret: env.NEXTAUTH_SECRET });
}
