import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Types } from "mongoose";
import { activateSmartQuestions } from "./activateQuestion";
import Question from "@/db/models/Question";
import { populateUserOptions } from "./populateUserOptions";

// Mock the dependencies
vi.mock("@/db/models/Question");
vi.mock("./populateUserOptions");

describe("activateSmartQuestions", () => {
    const mockGroupId = new Types.ObjectId();

    // Helper to create mock question objects
    const createMockQuestion = (overrides = {}) => ({
        _id: new Types.ObjectId(),
        groupId: mockGroupId,
        question: "Test question",
        active: false,
        used: false,
        usedAt: null,
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        (populateUserOptions as Mock).mockResolvedValue(undefined);
    });

    it("should deactivate currently active questions first", async () => {
        const activeQuestion = createMockQuestion({ active: true });

        // Setup: one active question exists, no new questions available
        (Question.find as Mock).mockResolvedValue([activeQuestion]);
        (Question.findOne as Mock).mockReturnValue({
            sort: vi.fn().mockResolvedValue(null),
        });

        await activateSmartQuestions(mockGroupId);

        // Verify the active question was deactivated
        expect(activeQuestion.active).toBe(false);
        expect(activeQuestion.save).toHaveBeenCalled();
    });

    it("should activate one custom question when available", async () => {
        const customQuestion = createMockQuestion({
            submittedBy: new Types.ObjectId(),
        });

        (Question.find as Mock).mockResolvedValue([]); // no active questions
        (Question.findOne as Mock)
            .mockReturnValueOnce({
                sort: vi.fn().mockResolvedValue(customQuestion),
            })
            .mockReturnValueOnce({
                sort: vi.fn().mockResolvedValue(null), // no template question
            });

        const result = await activateSmartQuestions(mockGroupId);

        expect(result).toHaveLength(1);
        expect(customQuestion.active).toBe(true);
        expect(customQuestion.used).toBe(true);
        expect(customQuestion.usedAt).toBeInstanceOf(Date);
        expect(populateUserOptions).toHaveBeenCalledWith(customQuestion);
    });

    it("should activate one template question when available", async () => {
        const templateQuestion = createMockQuestion({
            submittedBy: null,
        });

        (Question.find as Mock).mockResolvedValue([]);
        (Question.findOne as Mock)
            .mockReturnValueOnce({
                sort: vi.fn().mockResolvedValue(null), // no custom question
            })
            .mockReturnValueOnce({
                sort: vi.fn().mockResolvedValue(templateQuestion),
            });

        const result = await activateSmartQuestions(mockGroupId);

        expect(result).toHaveLength(1);
        expect(templateQuestion.active).toBe(true);
        expect(templateQuestion.used).toBe(true);
    });

    it("should activate both custom and template questions", async () => {
        const customQuestion = createMockQuestion({
            submittedBy: new Types.ObjectId(),
        });
        const templateQuestion = createMockQuestion({
            submittedBy: null,
        });

        (Question.find as Mock).mockResolvedValue([]);
        (Question.findOne as Mock)
            .mockReturnValueOnce({
                sort: vi.fn().mockResolvedValue(customQuestion),
            })
            .mockReturnValueOnce({
                sort: vi.fn().mockResolvedValue(templateQuestion),
            });

        const result = await activateSmartQuestions(mockGroupId);

        expect(result).toHaveLength(2);
        expect(customQuestion.active).toBe(true);
        expect(templateQuestion.active).toBe(true);
    });

    it("should return empty array when no questions available", async () => {
        (Question.find as Mock).mockResolvedValue([]);
        (Question.findOne as Mock).mockReturnValue({
            sort: vi.fn().mockResolvedValue(null),
        });

        const result = await activateSmartQuestions(mockGroupId);

        expect(result).toHaveLength(0);
    });

    it("should query for unused and inactive questions only", async () => {
        (Question.find as Mock).mockResolvedValue([]);
        (Question.findOne as Mock).mockReturnValue({
            sort: vi.fn().mockResolvedValue(null),
        });

        await activateSmartQuestions(mockGroupId);

        // Verify the queries include used: false and active: false
        expect(Question.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                groupId: mockGroupId,
                used: false,
                active: false,
            })
        );
    });
});
