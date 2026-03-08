import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { generalLimiter, authLimiter, rateLimitEnabled } from "@/lib/rateLimit";

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // --- IP-based rate limiting for API routes ---
    if (rateLimitEnabled && pathname.startsWith("/api")) {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const limiter = pathname.startsWith("/api/auth") ? authLimiter : generalLimiter;

        if (limiter) {
            const { success, reset } = await limiter.limit(ip);
            if (!success) {
                const retryAfter = Math.max(Math.ceil((reset - Date.now()) / 1000), 1);
                return NextResponse.json(
                    { message: "Too many requests" },
                    {
                        status: 429,
                        headers: {
                            "Content-Type": "application/json",
                            "Retry-After": String(retryAfter),
                        },
                    }
                );
            }
        }
    }

    const publicRoutes = new Set([
        "/api/auth/session",
        "/api/auth/providers",
        "/api/auth/csrf",
        "/api/auth/signin",
        "/api/auth/signin/google",
        "/api/auth/callback",
        "/api/auth/callback/credentials",
        "/deviceauth",
        "/manifest.json",
        "/api/cron",
        "/api/auth/callback/google",
        "/terms",
        "/privacy",
        "/setup-name",
        "/",
    ]);
    if (publicRoutes.has(pathname) || (pathname == "/api/users" && req.method === "POST")) {
        return NextResponse.next();
    }

    const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });
    if (!token) {
        if (pathname.startsWith("/api")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const loginUrl = new URL("/", req.url);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect new Google users to set their name
    if (
        token.needsNameSetup &&
        pathname !== "/setup-name" &&
        !pathname.startsWith("/api/auth") &&
        !pathname.startsWith("/api/users")
    ) {
        const setupUrl = new URL("/setup-name", req.url);
        return NextResponse.redirect(setupUrl);
    }

    return NextResponse.next();
}

// Proxy configuration to match relevant routes
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|public|manifest.json|AppIcons).*)"],
};
