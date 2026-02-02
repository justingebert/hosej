import { describe, it, expect } from "vitest";
import {
    AppError,
    ValidationError,
    AuthError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
} from "./errorHandling";

describe("Error Classes", () => {
    describe("AppError", () => {
        it("should create error with all properties", () => {
            const error = new AppError("TEST_CODE", "Test message", 500, { extra: "data" });

            expect(error.code).toBe("TEST_CODE");
            expect(error.message).toBe("Test message");
            expect(error.status).toBe(500);
            expect(error.details).toEqual({ extra: "data" });
            expect(error.name).toBe("AppError");
            expect(error).toBeInstanceOf(Error);
        });

        it("should work without details", () => {
            const error = new AppError("CODE", "Message", 400);

            expect(error.details).toBeUndefined();
        });
    });

    describe("ValidationError", () => {
        it("should have correct defaults", () => {
            const error = new ValidationError();

            expect(error.code).toBe("BAD REQUEST");
            expect(error.message).toBe("Bad Request");
            expect(error.status).toBe(400);
            expect(error.name).toBe("ValidationError");
        });

        it("should accept custom message", () => {
            const error = new ValidationError("Email is invalid");

            expect(error.message).toBe("Email is invalid");
            expect(error.status).toBe(400);
        });

        it("should accept details", () => {
            const details = { field: "email", reason: "invalid format" };
            const error = new ValidationError("Validation failed", details);

            expect(error.details).toEqual(details);
        });
    });

    describe("AuthError", () => {
        it("should have correct defaults", () => {
            const error = new AuthError();

            expect(error.code).toBe("UNAUTHORIZED");
            expect(error.message).toBe("Unauthorized");
            expect(error.status).toBe(401);
            expect(error.name).toBe("AuthError");
        });

        it("should accept custom message", () => {
            const error = new AuthError("Session expired");

            expect(error.message).toBe("Session expired");
        });
    });

    describe("ForbiddenError", () => {
        it("should have correct defaults", () => {
            const error = new ForbiddenError();

            expect(error.code).toBe("FORBIDDEN");
            expect(error.message).toBe("Forbidden");
            expect(error.status).toBe(403);
            expect(error.name).toBe("ForbiddenError");
        });

        it("should accept custom message", () => {
            const error = new ForbiddenError("You are not a member of this group");

            expect(error.message).toBe("You are not a member of this group");
        });
    });

    describe("NotFoundError", () => {
        it("should have correct defaults", () => {
            const error = new NotFoundError();

            expect(error.code).toBe("NOT_FOUND");
            expect(error.message).toBe("Not found");
            expect(error.status).toBe(404);
            expect(error.name).toBe("NotFoundError");
        });

        it("should accept custom message", () => {
            const error = new NotFoundError("Group not found");

            expect(error.message).toBe("Group not found");
        });
    });

    describe("ConflictError", () => {
        it("should have correct defaults", () => {
            const error = new ConflictError();

            expect(error.code).toBe("CONFLICT");
            expect(error.message).toBe("Conflict");
            expect(error.status).toBe(409);
            expect(error.name).toBe("ConflictError");
        });

        it("should accept custom message", () => {
            const error = new ConflictError("User already exists");

            expect(error.message).toBe("User already exists");
        });
    });

    describe("Error inheritance", () => {
        it("all errors should be instances of AppError", () => {
            expect(new ValidationError()).toBeInstanceOf(AppError);
            expect(new AuthError()).toBeInstanceOf(AppError);
            expect(new ForbiddenError()).toBeInstanceOf(AppError);
            expect(new NotFoundError()).toBeInstanceOf(AppError);
            expect(new ConflictError()).toBeInstanceOf(AppError);
        });

        it("all errors should be instances of Error", () => {
            expect(new ValidationError()).toBeInstanceOf(Error);
            expect(new AuthError()).toBeInstanceOf(Error);
            expect(new ForbiddenError()).toBeInstanceOf(Error);
            expect(new NotFoundError()).toBeInstanceOf(Error);
            expect(new ConflictError()).toBeInstanceOf(Error);
        });
    });
});
