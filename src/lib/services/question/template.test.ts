import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Types } from "mongoose";

vi.mock("@/db/models/QuestionTemplate");
vi.mock("@/db/models/QuestionPack");
vi.mock("@/db/models/Question");
vi.mock("@/db/models/Group");
vi.mock("@/lib/services/chat");

import {
    createTemplatesFromArray,
    addTemplatePackToGroup,
    getAvailablePacks,
    getGroupPacks,
} from "./template";
import QuestionTemplate from "@/db/models/QuestionTemplate";
import QuestionPack from "@/db/models/QuestionPack";
import Group from "@/db/models/Group";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { QuestionType } from "@/types/models/question";

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── createTemplatesFromArray ───────────────────────────────────────────────

describe("createTemplatesFromArray", () => {
    it("should create valid templates via insertMany and return loaded count", async () => {
        (QuestionTemplate.insertMany as Mock).mockResolvedValue([{}, {}]);
        (QuestionTemplate.countDocuments as Mock).mockResolvedValue(2);
        (QuestionPack.findOneAndUpdate as Mock).mockResolvedValue({});

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
        expect(result.errors).toHaveLength(0);
        expect(QuestionTemplate.insertMany).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ packId: "test-pack", category: "fun" }),
                expect.objectContaining({ packId: "test-pack", category: "serious" }),
            ])
        );
    });

    it("should upsert QuestionPack with metadata", async () => {
        (QuestionTemplate.insertMany as Mock).mockResolvedValue([{}]);
        (QuestionTemplate.countDocuments as Mock).mockResolvedValue(3);
        (QuestionPack.findOneAndUpdate as Mock).mockResolvedValue({});

        await createTemplatesFromArray(
            "my-pack",
            [
                {
                    category: "fun",
                    questionType: QuestionType.Text,
                    question: "Q?",
                },
            ],
            { name: "My Pack", description: "A fun pack", category: "fun" }
        );

        expect(QuestionPack.findOneAndUpdate).toHaveBeenCalledWith(
            { packId: "my-pack" },
            expect.objectContaining({
                $set: expect.objectContaining({
                    name: "My Pack",
                    description: "A fun pack",
                    category: "fun",
                    questionCount: 3,
                }),
            }),
            { upsert: true }
        );
    });

    it("should throw ValidationError for empty packId", async () => {
        await expect(createTemplatesFromArray("", [])).rejects.toThrow(ValidationError);
        await expect(createTemplatesFromArray("  ", [])).rejects.toThrow(ValidationError);
    });

    it("should return validation errors without inserting anything", async () => {
        const result = await createTemplatesFromArray("test-pack", [
            {
                category: "",
                questionType: "invalid-type",
                question: "",
            },
        ]);

        expect(result.loaded).toBe(0);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(QuestionTemplate.insertMany).not.toHaveBeenCalled();
    });

    it("should propagate database errors without creating QuestionPack", async () => {
        (QuestionTemplate.insertMany as Mock).mockRejectedValue(new Error("DB error"));

        await expect(
            createTemplatesFromArray("test-pack", [
                {
                    category: "fun",
                    questionType: QuestionType.CustomSelectOne,
                    question: "What is fun?",
                },
            ])
        ).rejects.toThrow("DB error");

        expect(QuestionPack.findOneAndUpdate).not.toHaveBeenCalled();
    });
});

// ─── addTemplatePackToGroup ─────────────────────────────────────────────────

describe("addTemplatePackToGroup", () => {
    it("should throw NotFoundError when group not found", async () => {
        (Group.findById as Mock).mockResolvedValue(null);

        await expect(
            addTemplatePackToGroup(new Types.ObjectId(), "nonexistent-pack")
        ).rejects.toThrow(NotFoundError);
    });

    it("should throw ConflictError when pack already added", async () => {
        const mockGroup = {
            features: { questions: { settings: { packs: ["starter-pack"] } } },
        };
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        await expect(addTemplatePackToGroup(new Types.ObjectId(), "starter-pack")).rejects.toThrow(
            ConflictError
        );
    });

    it("should throw NotFoundError when no templates found", async () => {
        const mockGroup = {
            features: { questions: { settings: { packs: [] } } },
        };
        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (QuestionTemplate.find as Mock).mockResolvedValue([]);

        await expect(
            addTemplatePackToGroup(new Types.ObjectId(), "nonexistent-pack")
        ).rejects.toThrow(NotFoundError);
    });

    it("should create questions and track pack on group", async () => {
        const groupId = new Types.ObjectId();
        const mockGroup = {
            features: { questions: { settings: { packs: [] } } },
        };
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        const templates = [
            {
                _id: new Types.ObjectId(),
                category: "fun",
                questionType: QuestionType.CustomSelectOne,
                question: "Q1?",
                options: ["A", "B"],
            },
        ];
        (QuestionTemplate.find as Mock).mockResolvedValue(templates);
        (Group.findByIdAndUpdate as Mock).mockResolvedValue(undefined);

        // Mock Question constructor + createChatForEntity for createQuestionFromTemplate
        const Question = (await import("@/db/models/Question")).default;
        const { createChatForEntity } = await import("@/lib/services/chat");

        vi.mocked(Question).mockImplementation(function (this: any, data: any) {
            Object.assign(this, { _id: new Types.ObjectId() }, data, {
                save: vi.fn().mockResolvedValue(undefined),
            });
            return this;
        } as any);
        (createChatForEntity as Mock).mockResolvedValue({
            _id: new Types.ObjectId(),
            save: vi.fn().mockResolvedValue(undefined),
        });

        await addTemplatePackToGroup(groupId, "test-pack");

        expect(QuestionTemplate.find).toHaveBeenCalledWith({ packId: "test-pack" });
        expect(Group.findByIdAndUpdate).toHaveBeenCalledWith(groupId, {
            $push: { "features.questions.settings.packs": "test-pack" },
        });
    });
});

// ─── getAvailablePacks ──────────────────────────────────────────────────────

describe("getAvailablePacks", () => {
    it("should return all packs sorted by name", async () => {
        const mockPacks = [
            { packId: "a-pack", name: "A Pack" },
            { packId: "b-pack", name: "B Pack" },
        ];
        (QuestionPack.find as Mock).mockReturnValue({
            sort: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockPacks),
            }),
        });

        const result = await getAvailablePacks();

        expect(result).toEqual(mockPacks);
        expect(QuestionPack.find).toHaveBeenCalled();
    });
});

// ─── getGroupPacks ──────────────────────────────────────────────────────────

describe("getGroupPacks", () => {
    it("should throw NotFoundError when group not found", async () => {
        (Group.findById as Mock).mockResolvedValue(null);

        await expect(getGroupPacks("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("should return packs with added status", async () => {
        const groupId = new Types.ObjectId().toString();
        const mockGroup = {
            features: { questions: { settings: { packs: ["starter-pack"] } } },
        };
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        const mockPacks = [
            { packId: "starter-pack", name: "Starter Pack" },
            { packId: "deep-pack", name: "Deep Pack" },
        ];
        (QuestionPack.find as Mock).mockReturnValue({
            sort: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockPacks),
            }),
        });

        const result = await getGroupPacks(groupId);

        expect(result).toHaveLength(2);
        expect(result[0].added).toBe(true);
        expect(result[1].added).toBe(false);
    });
});
