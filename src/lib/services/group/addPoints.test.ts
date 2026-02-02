import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Example test for the calculateStreak logic from addPoints service.
 * This demonstrates testing pure business logic extracted from models.
 */

// Helper function to create test dates
function createDate(daysAgo: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);
    return date;
}

// Extracted streak calculation logic for testing
function calculateStreak(
    lastPointDate: Date | null,
    lastQuestionDate: Date | null,
    currentStreak: number
): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const normalizedLastQuestionDate = lastQuestionDate
        ? new Date(new Date(lastQuestionDate).setHours(0, 0, 0, 0))
        : new Date(0);

    if (lastPointDate && lastPointDate.toDateString() === yesterday.toDateString()) {
        return currentStreak + 1;
    }

    if (lastPointDate && lastPointDate.toDateString() === today.toDateString()) {
        return currentStreak;
    }

    if (
        !lastQuestionDate ||
        (normalizedLastQuestionDate <= yesterday &&
            lastPointDate?.toDateString() === normalizedLastQuestionDate.toDateString())
    ) {
        return currentStreak + 1;
    }

    return 1;
}

describe("calculateStreak", () => {
    it("should increment streak if points were given yesterday", () => {
        const lastPointDate = createDate(1); // yesterday
        const result = calculateStreak(lastPointDate, null, 5);
        expect(result).toBe(6);
    });

    it("should keep streak the same if points already given today", () => {
        const lastPointDate = createDate(0); // today
        const result = calculateStreak(lastPointDate, null, 5);
        expect(result).toBe(5);
    });

    it("should reset streak to 1 if missed a day", () => {
        const lastPointDate = createDate(2); // 2 days ago
        const lastQuestionDate = createDate(1); // there was a question yesterday
        const result = calculateStreak(lastPointDate, lastQuestionDate, 5);
        expect(result).toBe(1);
    });

    it("should continue streak if no questions were available", () => {
        const lastQuestionDate = createDate(3); // last question was 3 days ago
        const lastPointDate = createDate(3); // points were given on that date
        const result = calculateStreak(lastPointDate, lastQuestionDate, 5);
        expect(result).toBe(6);
    });

    it("should start at 1 for first-time users", () => {
        const result = calculateStreak(null, createDate(1), 0);
        expect(result).toBe(1);
    });
});
