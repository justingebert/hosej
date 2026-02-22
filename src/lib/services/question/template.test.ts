import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Types } from "mongoose";

vi.mock("@/db/models/QuestionTemplate");
vi.mock("@/db/models/Question");
vi.mock("@/db/models/Chat");
vi.mock("@/db/dbConnect");

import { createTemplatesFromArray, addTemplatePackToGroup } from "./template";
import QuestionTemplate from "@/db/models/QuestionTemplate";
import dbConnect from "@/db/dbConnect";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { QuestionType } from "@/types/models/question";

beforeEach(() => {
    vi.clearAllMocks();
    (dbConnect as Mock).mockResolvedValue(undefined);
});

// ─── createTemplatesFromArray ───────────────────────────────────────────────

describe("createTemplatesFromArray", () => {
    it("should create valid templates and return loaded count", async () => {
        vi.mocked(QuestionTemplate).mockImplementation(function (this: any, data: any) {
            Object.assign(this, data, { save: vi.fn().mockResolvedValue(undefined) });
            return this;
        } as any);

        const result = await createTemplatesFromArray("test-pack", [
            {
                category: "fun",
                questionType: QuestionType.CustomSelectOne,
                question: "What is fun?",
                options: ["A", "B"],
            },
            {
                category: "serious",
                questionType: QuestionType.Text,
                question: "Describe yourself",
            },
        ]);

        expect(result.loaded).toBe(2);
        expect(result.skipped).toBe(0);
        expect(result.errors).toHaveLength(0);
    });

    it("should throw ValidationError for empty packId", async () => {
        await expect(createTemplatesFromArray("", [])).rejects.toThrow(ValidationError);
        await expect(createTemplatesFromArray("  ", [])).rejects.toThrow(ValidationError);
    });

    it("should return validation errors without creating anything", async () => {
        const result = await createTemplatesFromArray("test-pack", [
            {
                category: "",
                questionType: "invalid-type",
                question: "",
            },
        ]);

        expect(result.loaded).toBe(0);
        expect(result.skipped).toBe(1);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle database errors gracefully", async () => {
        vi.mocked(QuestionTemplate).mockImplementation(function (this: any, data: any) {
            Object.assign(this, data, {
                save: vi.fn().mockRejectedValue(new Error("DB error")),
            });
            return this;
        } as any);

        const result = await createTemplatesFromArray("test-pack", [
            {
                category: "fun",
                questionType: QuestionType.CustomSelectOne,
                question: "What is fun?",
            },
        ]);

        expect(result.loaded).toBe(0);
        expect(result.skipped).toBe(1);
        expect(result.errors[0].field).toBe("database");
    });
});

// ─── addTemplatePackToGroup ─────────────────────────────────────────────────

describe("addTemplatePackToGroup", () => {
    it("should throw NotFoundError when no templates found", async () => {
        (QuestionTemplate.find as Mock).mockResolvedValue([]);

        await expect(
            addTemplatePackToGroup(new Types.ObjectId(), "nonexistent-pack")
        ).rejects.toThrow(NotFoundError);
    });

    it("should create questions for each template in the pack", async () => {
        const templates = [
            {
                _id: new Types.ObjectId(),
                category: "fun",
                questionType: QuestionType.CustomSelectOne,
                question: "Q1?",
                options: ["A", "B"],
            },
            {
                _id: new Types.ObjectId(),
                category: "serious",
                questionType: QuestionType.Text,
                question: "Q2?",
                options: [],
            },
        ];
        (QuestionTemplate.find as Mock).mockResolvedValue(templates);

        // Mock Question and Chat constructors for createQuestionFromTemplate
        const Question = (await import("@/db/models/Question")).default;
        const Chat = (await import("@/db/models/Chat")).default;

        vi.mocked(Question).mockImplementation(function (this: any, data: any) {
            Object.assign(this, { _id: new Types.ObjectId() }, data, {
                save: vi.fn().mockResolvedValue(undefined),
            });
            return this;
        } as any);
        vi.mocked(Chat).mockImplementation(function (this: any, data: any) {
            Object.assign(this, { _id: new Types.ObjectId() }, data, {
                save: vi.fn().mockResolvedValue(undefined),
            });
            return this;
        } as any);

        const groupId = new Types.ObjectId();
        await addTemplatePackToGroup(groupId, "test-pack");

        expect(QuestionTemplate.find).toHaveBeenCalledWith({ packId: "test-pack" });
    });
});
