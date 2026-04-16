import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser, makeGroup } from "@/test/factories";
import {
    createTemplatesFromArray,
    addTemplatePackToGroup,
    getAvailablePacks,
    getGroupPacks,
} from "./template";
import QuestionTemplate from "@/db/models/QuestionTemplate";
import QuestionPack from "@/db/models/QuestionPack";
import Question from "@/db/models/Question";
import Group from "@/db/models/Group";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { QuestionType } from "@/types/models/question";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("createTemplatesFromArray", () => {
    it("creates valid templates and returns loaded count", async () => {
        const result = await createTemplatesFromArray("test-pack", [
            {
                category: "fun",
                questionType: QuestionType.Custom,
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

        const stored = await QuestionTemplate.find({ packId: "test-pack" });
        expect(stored).toHaveLength(2);
    });

    it("upserts QuestionPack with metadata", async () => {
        await createTemplatesFromArray(
            "my-pack",
            [
                {
                    category: "fun",
                    questionType: QuestionType.Text,
                    question: "Q1?",
                },
                {
                    category: "fun",
                    questionType: QuestionType.Text,
                    question: "Q2?",
                },
                {
                    category: "fun",
                    questionType: QuestionType.Text,
                    question: "Q3?",
                },
            ],
            { name: "My Pack", description: "A fun pack", category: "fun" }
        );

        const pack = await QuestionPack.findOne({ packId: "my-pack" });
        expect(pack?.name).toBe("My Pack");
        expect(pack?.description).toBe("A fun pack");
        expect(pack?.category).toBe("fun");
        expect(pack?.questionCount).toBe(3);
    });

    it("throws ValidationError for empty packId", async () => {
        await expect(createTemplatesFromArray("", [])).rejects.toThrow(ValidationError);
        await expect(createTemplatesFromArray("  ", [])).rejects.toThrow(ValidationError);
    });

    it("returns validation errors without inserting anything", async () => {
        const result = await createTemplatesFromArray("test-pack", [
            {
                category: "",
                questionType: "invalid-type",
                question: "",
            },
        ]);

        expect(result.loaded).toBe(0);
        expect(result.errors.length).toBeGreaterThan(0);

        const stored = await QuestionTemplate.find({ packId: "test-pack" });
        expect(stored).toHaveLength(0);
    });
});

describe("addTemplatePackToGroup", () => {
    it("throws NotFoundError when group not found", async () => {
        await expect(
            addTemplatePackToGroup(new Types.ObjectId(), "nonexistent-pack")
        ).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError when pack already added", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });
        group.features.questions.settings.packs = ["starter-pack"];
        await group.save();

        await expect(addTemplatePackToGroup(group._id, "starter-pack")).rejects.toThrow(
            ConflictError
        );
    });

    it("throws NotFoundError when no templates found for pack", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });

        await expect(addTemplatePackToGroup(group._id, "nonexistent-pack")).rejects.toThrow(
            NotFoundError
        );
    });

    it("creates questions and tracks pack on group", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });

        await QuestionTemplate.create([
            {
                packId: "test-pack",
                category: "fun",
                questionType: QuestionType.Custom,
                question: "Q1?",
                multiSelect: false,
                options: ["A", "B"],
            },
            {
                packId: "test-pack",
                category: "fun",
                questionType: QuestionType.Text,
                question: "Q2?",
            },
        ]);

        await addTemplatePackToGroup(group._id, "test-pack");

        const questions = await Question.find({ groupId: group._id });
        expect(questions).toHaveLength(2);
        expect(questions[0].submittedBy).toBeNull();

        const reloaded = await Group.findById(group._id);
        expect(reloaded?.features.questions.settings.packs).toContain("test-pack");
    });
});

describe("getAvailablePacks", () => {
    it("returns all packs sorted by name", async () => {
        await QuestionPack.create([
            { packId: "b-pack", name: "B Pack" },
            { packId: "a-pack", name: "A Pack" },
        ]);

        const result = await getAvailablePacks();

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe("A Pack");
        expect(result[1].name).toBe("B Pack");
    });
});

describe("getGroupPacks", () => {
    it("throws NotFoundError when group not found", async () => {
        await expect(getGroupPacks(new Types.ObjectId().toString())).rejects.toThrow(NotFoundError);
    });

    it("returns packs with added status", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });
        group.features.questions.settings.packs = ["starter-pack"];
        await group.save();

        await QuestionPack.create([
            { packId: "starter-pack", name: "Starter Pack" },
            { packId: "deep-pack", name: "Deep Pack" },
        ]);

        const result = await getGroupPacks(group._id.toString());

        expect(result).toHaveLength(2);
        const starter = result.find((p) => p.packId === "starter-pack");
        const deep = result.find((p) => p.packId === "deep-pack");
        expect(starter?.added).toBe(true);
        expect(deep?.added).toBe(false);
    });
});
