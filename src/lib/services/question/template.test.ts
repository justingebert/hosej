import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser, makeGroup } from "@/test/factories";
import {
    createTemplatesFromArray,
    addTemplatePackToGroup,
    getAvailablePacks,
    getAllPacks,
    getGroupPacks,
    updatePackStatus,
    deletePack,
} from "./template";
import QuestionTemplate from "@/db/models/QuestionTemplate";
import QuestionPack from "@/db/models/QuestionPack";
import Question from "@/db/models/Question";
import Group from "@/db/models/Group";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { QuestionType } from "@/types/models/question";
import { QuestionPackStatus } from "@/types/models/questionPack";

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

    it("upserts QuestionPack with metadata and defaults status to active", async () => {
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
        expect(pack?.status).toBe(QuestionPackStatus.Active);
    });

    it("preserves existing pack status on re-upload", async () => {
        await QuestionPack.create({
            packId: "existing-pack",
            name: "Existing",
            status: QuestionPackStatus.Deprecated,
        });

        await createTemplatesFromArray("existing-pack", [
            {
                category: "fun",
                questionType: QuestionType.Text,
                question: "Q1?",
            },
        ]);

        const pack = await QuestionPack.findOne({ packId: "existing-pack" });
        expect(pack?.status).toBe(QuestionPackStatus.Deprecated);
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
    it("throws NotFoundError when pack not found", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });

        await expect(addTemplatePackToGroup(group._id, "nonexistent-pack")).rejects.toThrow(
            NotFoundError
        );
    });

    it("throws ValidationError when pack is deprecated", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });
        await QuestionPack.create({
            packId: "old-pack",
            name: "Old Pack",
            status: QuestionPackStatus.Deprecated,
        });
        await QuestionTemplate.create({
            packId: "old-pack",
            category: "fun",
            questionType: QuestionType.Text,
            question: "Q?",
        });

        await expect(addTemplatePackToGroup(group._id, "old-pack")).rejects.toThrow(
            ValidationError
        );
    });

    it("throws ValidationError when pack is archived", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });
        await QuestionPack.create({
            packId: "dead-pack",
            name: "Dead Pack",
            status: QuestionPackStatus.Archived,
        });

        await expect(addTemplatePackToGroup(group._id, "dead-pack")).rejects.toThrow(
            ValidationError
        );
    });

    it("throws NotFoundError when group not found", async () => {
        await QuestionPack.create({
            packId: "pack-x",
            name: "Pack X",
            status: QuestionPackStatus.Active,
        });

        await expect(addTemplatePackToGroup(new Types.ObjectId(), "pack-x")).rejects.toThrow(
            NotFoundError
        );
    });

    it("throws ConflictError when pack already added", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });
        group.features.questions.settings.packs = ["starter-pack"];
        await group.save();

        await QuestionPack.create({
            packId: "starter-pack",
            name: "Starter",
            status: QuestionPackStatus.Active,
        });

        await expect(addTemplatePackToGroup(group._id, "starter-pack")).rejects.toThrow(
            ConflictError
        );
    });

    it("throws NotFoundError when no templates found for pack", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });

        await QuestionPack.create({
            packId: "empty-pack",
            name: "Empty",
            status: QuestionPackStatus.Active,
        });

        await expect(addTemplatePackToGroup(group._id, "empty-pack")).rejects.toThrow(
            NotFoundError
        );
    });

    it("creates questions and tracks pack on group", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });

        await QuestionPack.create({
            packId: "test-pack",
            name: "Test",
            status: QuestionPackStatus.Active,
        });
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
    it("returns only active packs sorted by name", async () => {
        await QuestionPack.create([
            { packId: "b-pack", name: "B Pack", status: QuestionPackStatus.Active },
            { packId: "a-pack", name: "A Pack", status: QuestionPackStatus.Active },
            { packId: "d-pack", name: "D Pack", status: QuestionPackStatus.Deprecated },
            { packId: "z-pack", name: "Z Pack", status: QuestionPackStatus.Archived },
        ]);

        const result = await getAvailablePacks();

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe("A Pack");
        expect(result[1].name).toBe("B Pack");
    });
});

describe("getAllPacks", () => {
    it("returns packs of every status sorted by name", async () => {
        await QuestionPack.create([
            { packId: "b-pack", name: "B Pack", status: QuestionPackStatus.Active },
            { packId: "d-pack", name: "D Pack", status: QuestionPackStatus.Deprecated },
            { packId: "z-pack", name: "Z Pack", status: QuestionPackStatus.Archived },
        ]);

        const result = await getAllPacks();

        expect(result).toHaveLength(3);
    });
});

describe("getGroupPacks", () => {
    it("throws NotFoundError when group not found", async () => {
        await expect(getGroupPacks(new Types.ObjectId().toString())).rejects.toThrow(NotFoundError);
    });

    it("filters out active packs tagged with a different language but keeps cross-language added packs", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id, language: "en" });
        group.features.questions.settings.packs = ["de-added"];
        await group.save();

        await QuestionPack.create([
            {
                packId: "en-pack",
                name: "English Pack",
                status: QuestionPackStatus.Active,
                tags: ["en"],
            },
            {
                packId: "de-pack",
                name: "German Pack",
                status: QuestionPackStatus.Active,
                tags: ["de"],
            },
            {
                packId: "untagged-pack",
                name: "Untagged Pack",
                status: QuestionPackStatus.Active,
                tags: [],
            },
            {
                packId: "de-added",
                name: "Added German",
                status: QuestionPackStatus.Active,
                tags: ["de"],
            },
        ]);

        const result = await getGroupPacks(group._id.toString());

        const ids = result.map((p) => p.packId).sort();
        expect(ids).toEqual(["de-added", "en-pack", "untagged-pack"]);
        expect(result.find((p) => p.packId === "de-added")?.added).toBe(true);
    });

    it("returns active packs plus any added packs (even deprecated/archived)", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });
        group.features.questions.settings.packs = ["starter-pack", "legacy-pack"];
        await group.save();

        await QuestionPack.create([
            { packId: "starter-pack", name: "Starter", status: QuestionPackStatus.Active },
            { packId: "deep-pack", name: "Deep", status: QuestionPackStatus.Active },
            { packId: "legacy-pack", name: "Legacy", status: QuestionPackStatus.Deprecated },
            { packId: "hidden-pack", name: "Hidden", status: QuestionPackStatus.Archived },
        ]);

        const result = await getGroupPacks(group._id.toString());

        const ids = result.map((p) => p.packId).sort();
        expect(ids).toEqual(["deep-pack", "legacy-pack", "starter-pack"]);

        const starter = result.find((p) => p.packId === "starter-pack");
        const deep = result.find((p) => p.packId === "deep-pack");
        const legacy = result.find((p) => p.packId === "legacy-pack");
        expect(starter?.added).toBe(true);
        expect(deep?.added).toBe(false);
        expect(legacy?.added).toBe(true);
    });
});

describe("updatePackStatus", () => {
    it("changes status and returns updated pack", async () => {
        await QuestionPack.create({
            packId: "pack-x",
            name: "Pack X",
            status: QuestionPackStatus.Active,
        });

        const result = await updatePackStatus("pack-x", QuestionPackStatus.Deprecated);

        expect(result.status).toBe(QuestionPackStatus.Deprecated);
        const reloaded = await QuestionPack.findOne({ packId: "pack-x" });
        expect(reloaded?.status).toBe(QuestionPackStatus.Deprecated);
    });

    it("throws NotFoundError when pack missing", async () => {
        await expect(updatePackStatus("ghost", QuestionPackStatus.Deprecated)).rejects.toThrow(
            NotFoundError
        );
    });
});

describe("deletePack", () => {
    it("deletes pack + templates and removes packId from groups, leaving Question.templateId dangling", async () => {
        const admin = await makeUser();
        const group = await makeGroup({ admin: admin._id });

        await QuestionPack.create({
            packId: "doomed-pack",
            name: "Doomed",
            status: QuestionPackStatus.Active,
        });
        await QuestionTemplate.create([
            {
                packId: "doomed-pack",
                category: "fun",
                questionType: QuestionType.Text,
                question: "Q1?",
            },
            {
                packId: "doomed-pack",
                category: "fun",
                questionType: QuestionType.Text,
                question: "Q2?",
            },
        ]);

        await addTemplatePackToGroup(group._id, "doomed-pack");

        const questionsBefore = await Question.find({ groupId: group._id });
        expect(questionsBefore).toHaveLength(2);
        const templateIdsBefore = questionsBefore.map((q) => q.templateId?.toString());

        const result = await deletePack("doomed-pack");

        expect(result.templatesDeleted).toBe(2);
        expect(result.groupsUpdated).toBe(1);

        expect(await QuestionPack.findOne({ packId: "doomed-pack" })).toBeNull();
        expect(await QuestionTemplate.find({ packId: "doomed-pack" })).toHaveLength(0);

        const reloaded = await Group.findById(group._id);
        expect(reloaded?.features.questions.settings.packs).not.toContain("doomed-pack");

        // Historical questions survive with dangling templateId
        const questionsAfter = await Question.find({ groupId: group._id });
        expect(questionsAfter).toHaveLength(2);
        const templateIdsAfter = questionsAfter.map((q) => q.templateId?.toString());
        expect(templateIdsAfter).toEqual(templateIdsBefore);
    });

    it("throws NotFoundError when pack missing", async () => {
        await expect(deletePack("ghost")).rejects.toThrow(NotFoundError);
    });
});
