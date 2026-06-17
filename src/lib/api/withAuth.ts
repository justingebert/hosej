import type { NextRequest } from "next/server";
import type { ApiRoute, NextRouteHandler } from "./errorHandling";
import { AuthError, withErrorHandling } from "./errorHandling";
import { resolveAuthToken } from "@/lib/auth/getAuthToken";
import { assertValidMobileAccessToken } from "@/lib/services/user/user";

export type AuthedContext<T = {}> = T & { userId: string };

/**
 * Ensures the request is authenticated. Returns 401 JSON for API routes when unauthenticated.
 * Injects userId into the route context for downstream handlers.
 */
export function withAuth<TCtx = {}>(handler: ApiRoute<AuthedContext<TCtx>>): ApiRoute<TCtx> {
    return async (req: NextRequest, context: TCtx) => {
        const auth = await resolveAuthToken(req);
        const token = auth?.token;
        if (!token?.userId) {
            throw new AuthError("Unauthorized");
        }
        if (auth?.source === "mobile") {
            await assertValidMobileAccessToken(token);
        }
        const userId = String(token.userId);
        return handler(req, Object.assign({}, context, { userId }));
    };
}

/**
 * Composes withAuth and withErrorHandling so routes can use both with a single wrapper.
 */
export function withAuthAndErrors<TCtx = {}>(
    handler: ApiRoute<AuthedContext<TCtx>>
): NextRouteHandler {
    return withErrorHandling(withAuth(handler));
}
