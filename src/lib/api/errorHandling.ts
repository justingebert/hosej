import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Error as mongooseError } from "mongoose";
import dbConnect from "@/db/dbConnect";

export type ApiRoute<TContext = {}> = (
    req: NextRequest,
    context: TContext
) => Promise<NextResponse>;

// Next.js 16 route handler type — uses `any` for context so the build-time
// route-signature validation passes (params is a Promise at runtime, but our
// wrapper resolves it before forwarding to the inner handler).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NextRouteHandler = (req: NextRequest, context: any) => Promise<NextResponse>;

export class AppError extends Error {
    constructor(
        public code: string,
        message: string,
        public status: number,
        public details?: unknown
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ValidationError extends AppError {
    constructor(message = "Bad Request", details?: unknown) {
        super("BAD REQUEST", message, 400, details);
    }
}

export class AuthError extends AppError {
    constructor(message = "Unauthorized") {
        super("UNAUTHORIZED", message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super("FORBIDDEN", message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Not found") {
        super("NOT_FOUND", message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super("CONFLICT", message, 409);
    }
}

function errorResponse(req: NextRequest, error: Error): NextResponse {
    if (error instanceof AppError) {
        return NextResponse.json(
            { message: error.message },
            {
                status: error.status,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    if (error instanceof mongooseError.DocumentNotFoundError) {
        return NextResponse.json(
            { message: error.message },
            { status: 404, headers: { "Content-Type": "application/json" } }
        );
    }

    if (error instanceof mongooseError.CastError) {
        return NextResponse.json(
            { message: "Invalid ID format" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    console.error(`API Route Error: ${req.url}`, error);
    return NextResponse.json(
        { message: "Internal Server Error" },
        {
            status: 500,
            headers: { "Content-Type": "application/json" },
        }
    );
}

export function withErrorHandling<TContext = {}>(fn: ApiRoute<TContext>): NextRouteHandler {
    return async (req: NextRequest, context: TContext): Promise<NextResponse> => {
        try {
            await dbConnect();
            // Next.js 16: params is now async and must be awaited
            if (context && typeof context === "object" && "params" in context) {
                (context as Record<string, unknown>).params = await (
                    context as Record<string, unknown>
                ).params;
            }
            return await fn(req, context);
        } catch (error: unknown) {
            return errorResponse(req, error as Error);
        }
    };
}
