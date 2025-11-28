import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { ApiRoute } from "./errorHandling";
import { AuthError, withErrorHandling } from "./errorHandling";

export type AuthedContext<T = {}> = T & { userId: string };

/**
 * Ensures the request is authenticated. Returns 401 JSON for API routes when unauthenticated.
 * Injects userId into the route context for downstream handlers.
 */
export function withAuth<TCtx = {}>(handler: ApiRoute<AuthedContext<TCtx>>): ApiRoute<TCtx> {
    return async (req: NextRequest, context: TCtx) => {
        const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET});
        if (!token?.userId) {
            throw new AuthError("Unauthorized");
        }
        const userId = String(token.userId);
        return handler(req, Object.assign({}, context, {userId}));
    };
}

/**
 * Composes withAuth and withErrorHandling so routes can use both with a single wrapper.
 */
export function withAuthAndErrors<TCtx = {}>(
    handler: ApiRoute<AuthedContext<TCtx>>
): ApiRoute<TCtx> {
    return withErrorHandling(withAuth(handler));
}
