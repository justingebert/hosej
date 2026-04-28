import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SOURCE_COOKIE = "hosej_src";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const CODE_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const DEFAULT_CAMPAIGN = "launch";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
    const { code } = await context.params;
    const safeCode = CODE_PATTERN.test(code) ? code : "invalid";

    const to = req.nextUrl.searchParams.get("to");
    const target = new URL(to && to.startsWith("/") ? to : "/", req.nextUrl.origin);
    target.searchParams.set("utm_source", safeCode);
    target.searchParams.set("utm_medium", "qr");
    target.searchParams.set("utm_campaign", DEFAULT_CAMPAIGN);

    const res = NextResponse.redirect(target, 302);
    res.cookies.set(SOURCE_COOKIE, safeCode, {
        path: "/",
        maxAge: COOKIE_MAX_AGE_SECONDS,
        sameSite: "lax",
    });
    return res;
}
