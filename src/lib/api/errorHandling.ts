import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { Error as mongooseError } from "mongoose";

export type ApiRoute<TContext = {}> = (
    req: NextRequest,
    context: TContext
) => Promise<NextResponse>;

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

export function withErrorHandling<TContext = {}>(fn: ApiRoute<TContext>): ApiRoute<TContext> {
    return async (req: NextRequest, context: TContext): Promise<NextResponse> => {
        try {
            return await fn(req, context);
        } catch (error: any) {
            return errorResponse(req, error);
        }
    };
}
