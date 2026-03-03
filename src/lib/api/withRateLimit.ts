import type { Ratelimit } from "@upstash/ratelimit";
import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import type { AuthedContext } from "./withAuth";
import { RateLimitError } from "./errorHandling";

type AuthedHandler<TCtx> = (
    req: NextRequest,
    context: AuthedContext<TCtx>
) => Promise<NextResponse>;

/**
 * Composable rate-limit wrapper for authenticated routes.
 * Uses `context.userId` as the rate-limit key.
 *
 * Usage: `withAuthAndErrors(withRateLimit(voteLimiter, handler))`
 *
 * When the limiter is null (env vars missing / dev mode), passes through.
 */
export function withRateLimit<TCtx = {}>(
    limiter: Ratelimit | null,
    handler: AuthedHandler<TCtx>
): AuthedHandler<TCtx> {
    if (!limiter) return handler;

    return async (req: NextRequest, context: AuthedContext<TCtx>) => {
        const { success, reset } = await limiter.limit(context.userId);
        if (!success) {
            const retryAfter = Math.ceil((reset - Date.now()) / 1000);
            throw new RateLimitError(Math.max(retryAfter, 1));
        }
        return handler(req, context);
    };
}
