import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { generateConnectToken } from "@/lib/services/user/user";
import { CONNECT_TOKEN_COOKIE, CONNECT_TOKEN_TTL_SECONDS } from "@/lib/auth/connectToken";

export const POST = withAuthAndErrors(async (_req: NextRequest, { userId }: AuthedContext) => {
    const connectToken = await generateConnectToken(userId);

    // Token is bound to this browser via an httpOnly cookie. The Google
    // sign-in callback requires an exact match between the cookie token and
    // the user's stored connectToken before merging accounts — without this
    // binding, any concurrent Google sign-in could hijack a pending link.
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
        name: CONNECT_TOKEN_COOKIE,
        value: connectToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: CONNECT_TOKEN_TTL_SECONDS,
    });
    return response;
});
