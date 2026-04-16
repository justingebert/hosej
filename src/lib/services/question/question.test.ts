import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

vi.mock("@/lib/integrations/storage", () => import("@/test/fakes/storage"));

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser, makeGroup, makeQuestion } from "@/test/factories";
import {
    createQuestion,
    createQuestionFromTemplate,
    getActiveQuestions,
    getQuestionById,
    voteOnQuestion,
    rateQuestion,
    getQuestionResults,
    updateQuestionAttachments,
    activateSmartQuestions,
    deactivateCurrentQuestions,
    parseVoteResponse,
} from "./question";
import Question from "@/db/models/Question";
import Chat from "@/db/models/Chat";
import { resetStorageFake } from "@/test/fakes/storage";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { PairingKeySource, PairingMode, QuestionType } from "@/types/models/question";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(async () => {
    await clearCollections();
    resetStorageFake();
    vi.clearAllMocks();
});

describe("createQuestion", () => {
    it("creates a question with a linked chat and awards points", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U", points: 0 }],
        });

        const result = await createQuestion(group._id.toString(), user._id.toString(), {
            category: "general",
            questionType: QuestionType.Custom,
            question: "Test?",
            submittedBy: user._id.toString(),
            options: ["A", "B"],
        });

        expect(result.question).toBe("Test?");
        expect(result.chat).toBeTruthy();

        const stored = await Question.findById(result._id);
        expect(stored?.options).toEqual(["A", "B"]);

        const chat = await Chat.findById(result.chat);
        expect(chat?.entity.toString()).toBe(stored?._id.toString());

        const reloaded = await (await import("@/db/models/Group")).default.findById(group._id);
        expect(reloaded?.members[0].points).toBeGreaterThan(0);
    });

    it("throws ValidationError when required fields are missing", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });

        await expect(
            createQuestion(group._id.toString(), user._id.toString(), {
                category: "",
                questionType: QuestionType.Custom,
                question: "Test?",
                submittedBy: user._id.toString(),
            })
        ).rejects.toThrow(ValidationError);
    });

    it("auto-generates 1-10 options for rating type", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });

        const result = await createQuestion(group._id.toString(), user._id.toString(), {
            category: "fun",
            questionType: QuestionType.Rating,
            question: "Rate this?",
            submittedBy: user._id.toString(),
        });

        expect(result.options).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    });

    it("creates a pairing question with required fields", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });

        const result = await createQuestion(group._id.toString(), user._id.toString(), {
            category: "fun",
            questionType: QuestionType.Pairing,
            question: "Match members to traits",
            submittedBy: user._id.toString(),
            pairing: {
                keySource: PairingKeySource.Custom,
                mode: PairingMode.Exclusive,
                keys: ["Alice", "Bob"],
                values: ["Funny", "Smart"],
            },
        });

        expect(result.pairing?.keys).toEqual(["Alice", "Bob"]);
    });

    it("throws ValidationError for pairing without pairing config", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });

        await expect(
            createQuestion(group._id.toString(), user._id.toString(), {
                category: "fun",
                questionType: QuestionType.Pairing,
                question: "Match?",
                submittedBy: user._id.toString(),
            })
        ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError for pairing with fewer than 2 values", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });

        await expect(
            createQuestion(group._id.toString(), user._id.toString(), {
                category: "fun",
                questionType: QuestionType.Pairing,
                question: "Match?",
                submittedBy: user._id.toString(),
                pairing: {
                    keySource: PairingKeySource.Custom,
                    mode: PairingMode.Open,
                    keys: ["A", "B"],
                    values: ["X"],
                },
            })
        ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError for exclusive pairing with fewer values than keys", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });

        await expect(
            createQuestion(group._id.toString(), user._id.toString(), {
                category: "fun",
                questionType: QuestionType.Pairing,
                question: "Match?",
                submittedBy: user._id.toString(),
                pairing: {
                    keySource: PairingKeySource.Custom,
                    mode: PairingMode.Exclusive,
                    keys: ["A", "B", "C"],
                    values: ["X", "Y"],
                },
            })
        ).rejects.toThrow(ValidationError);
    });
});

describe("createQuestionFromTemplate", () => {
    it("creates a question without awarding points", async () => {
        const admin = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [{ user: admin._id, name: "A", points: 0 }],
        });

        const result = await createQuestionFromTemplate(
            group._id,
            "general",
            QuestionType.Custom,
            "Template Q?",
            "",
            ["A", "B"],
            new Types.ObjectId()
        );

        expect(result.question).toBe("Template Q?");
        expect(result.submittedBy).toBeNull();

        const Group = (await import("@/db/models/Group")).default;
        const reloaded = await Group.findById(group._id);
        expect(reloaded?.members[0].points ?? 0).toBe(0);
    });
});

describe("getActiveQuestions", () => {
    it("returns empty array when no active questions", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });

        const result = await getActiveQuestions(group._id.toString(), user._id.toString());

        expect(result.questions).toEqual([]);
        expect(result.completionPercentage).toBe(0);
    });

    it("returns questions with userHasVoted and userRating", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });
        const q = await makeQuestion({
            groupId: group._id,
            active: true,
            used: true,
            options: ["A", "B"],
        });
        q.answers.push({
            user: user._id,
            response: "A",
            time: new Date(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        q.rating.good.push(user._id);
        await q.save();

        const result = await getActiveQuestions(group._id.toString(), user._id.toString());

        expect(result.questions).toHaveLength(1);
        expect(result.questions[0]).toMatchObject({
            userHasVoted: true,
            userRating: "good",
        });
    });

    it("calculates completion percentage", async () => {
        const user = await makeUser();
        const other = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [
                { user: user._id, name: "U" },
                { user: other._id, name: "O" },
            ],
        });
        const q = await makeQuestion({ groupId: group._id, active: true, used: true });
        q.answers.push(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { user: user._id, response: "A", time: new Date() } as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { user: other._id, response: "B", time: new Date() } as any
        );
        await q.save();

        const result = await getActiveQuestions(group._id.toString(), user._id.toString());

        expect(result.completionPercentage).toBe(100);
    });
});

describe("getQuestionById", () => {
    it("returns question when found", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id });

        const result = await getQuestionById(group._id.toString(), q._id.toString());

        expect(result.question).toBe(q.question);
    });

    it("throws NotFoundError when question not found", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });

        await expect(
            getQuestionById(group._id.toString(), new Types.ObjectId().toString())
        ).rejects.toThrow(NotFoundError);
    });

    it("generates signed URL for image questions", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({
            groupId: group._id,
            question: "Pick one",
            questionType: QuestionType.Custom,
        });
        q.image = "group1/question/q1/image.jpg";
        await q.save();

        const result = await getQuestionById(group._id.toString(), q._id.toString());

        expect(result.imageUrl).toBe("https://fake-s3.example.com/group1/question/q1/image.jpg");
    });
});

describe("voteOnQuestion", () => {
    it("submits a vote and awards points", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U", points: 0 }],
        });
        const q = await makeQuestion({ groupId: group._id, options: ["A", "B"] });

        const result = await voteOnQuestion(
            group._id.toString(),
            q._id.toString(),
            user._id.toString(),
            "A"
        );

        expect(result.alreadyVoted).toBe(false);

        const reloaded = await Question.findById(q._id);
        expect(reloaded?.answers).toHaveLength(1);

        const Group = (await import("@/db/models/Group")).default;
        const groupReloaded = await Group.findById(group._id);
        expect(groupReloaded?.members[0].points).toBeGreaterThan(0);
    });

    it("returns alreadyVoted=true when user already voted", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });
        const q = await makeQuestion({ groupId: group._id });
        q.answers.push(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { user: user._id, response: "A", time: new Date() } as any
        );
        await q.save();

        const result = await voteOnQuestion(
            group._id.toString(),
            q._id.toString(),
            user._id.toString(),
            "B"
        );

        expect(result.alreadyVoted).toBe(true);
    });

    it("throws NotFoundError when question not found", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });

        await expect(
            voteOnQuestion(
                group._id.toString(),
                new Types.ObjectId().toString(),
                user._id.toString(),
                "A"
            )
        ).rejects.toThrow(NotFoundError);
    });

    it("throws ValidationError for invalid response", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id });

        await expect(
            voteOnQuestion(
                group._id.toString(),
                q._id.toString(),
                user._id.toString(),
                123 as unknown as string
            )
        ).rejects.toThrow(ValidationError);
    });

    it("accepts pairing vote with valid keys and values", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });
        const q = await makeQuestion({
            groupId: group._id,
            questionType: QuestionType.Pairing,
        });
        q.pairing = {
            keySource: PairingKeySource.Custom,
            mode: PairingMode.Exclusive,
            keys: ["Alice", "Bob"],
            values: ["Funny", "Smart"],
        };
        await q.save();

        const result = await voteOnQuestion(
            group._id.toString(),
            q._id.toString(),
            user._id.toString(),
            { Alice: "Funny", Bob: "Smart" }
        );

        expect(result.alreadyVoted).toBe(false);
    });

    it("rejects exclusive pairing vote with duplicate values", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id, questionType: QuestionType.Pairing });
        q.pairing = {
            keySource: PairingKeySource.Custom,
            mode: PairingMode.Exclusive,
            keys: ["Alice", "Bob"],
            values: ["Funny", "Smart"],
        };
        await q.save();

        await expect(
            voteOnQuestion(group._id.toString(), q._id.toString(), user._id.toString(), {
                Alice: "Funny",
                Bob: "Funny",
            })
        ).rejects.toThrow(ValidationError);
    });

    it("allows open pairing vote with duplicate values", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });
        const q = await makeQuestion({ groupId: group._id, questionType: QuestionType.Pairing });
        q.pairing = {
            keySource: PairingKeySource.Custom,
            mode: PairingMode.Open,
            keys: ["Alice", "Bob"],
            values: ["Funny", "Smart"],
        };
        await q.save();

        const result = await voteOnQuestion(
            group._id.toString(),
            q._id.toString(),
            user._id.toString(),
            { Alice: "Funny", Bob: "Funny" }
        );

        expect(result.alreadyVoted).toBe(false);
    });

    it("rejects pairing vote with invalid key", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id, questionType: QuestionType.Pairing });
        q.pairing = {
            keySource: PairingKeySource.Custom,
            mode: PairingMode.Open,
            keys: ["Alice", "Bob"],
            values: ["Funny", "Smart"],
        };
        await q.save();

        await expect(
            voteOnQuestion(group._id.toString(), q._id.toString(), user._id.toString(), {
                Charlie: "Funny",
            })
        ).rejects.toThrow(ValidationError);
    });
});

describe("rateQuestion", () => {
    it("adds a new rating", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id });

        const result = await rateQuestion(q._id.toString(), user._id.toString(), "good");

        expect(result.previousRating).toBeNull();
        expect(result.newRating).toBe("good");

        const reloaded = await Question.findById(q._id);
        expect(reloaded?.rating.good).toHaveLength(1);
    });

    it("changes rating from good to ok", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id });
        q.rating.good.push(user._id);
        await q.save();

        const result = await rateQuestion(q._id.toString(), user._id.toString(), "ok");

        expect(result.previousRating).toBe("good");
        expect(result.newRating).toBe("ok");

        const reloaded = await Question.findById(q._id);
        expect(reloaded?.rating.good).toHaveLength(0);
        expect(reloaded?.rating.ok).toHaveLength(1);
    });

    it("handles re-submitting the same rating", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id });
        q.rating.ok.push(user._id);
        await q.save();

        const result = await rateQuestion(q._id.toString(), user._id.toString(), "ok");

        expect(result.previousRating).toBe("ok");
        expect(result.newRating).toBe("ok");

        const reloaded = await Question.findById(q._id);
        expect(reloaded?.rating.ok).toHaveLength(1);
    });

    it("throws ValidationError for invalid rating", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id });

        await expect(
            rateQuestion(q._id.toString(), user._id.toString(), "excellent")
        ).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when question not found", async () => {
        const user = await makeUser();

        await expect(
            rateQuestion(new Types.ObjectId().toString(), user._id.toString(), "good")
        ).rejects.toThrow(NotFoundError);
    });
});

describe("getQuestionResults", () => {
    it("returns aggregated results sorted by count", async () => {
        const alice = await makeUser({ username: "Alice" });
        const bob = await makeUser({ username: "Bob" });
        const charlie = await makeUser({ username: "Charlie" });
        const group = await makeGroup({
            admin: alice._id,
            members: [
                { user: alice._id, name: "Alice" },
                { user: bob._id, name: "Bob" },
                { user: charlie._id, name: "Charlie" },
            ],
        });
        const q = await makeQuestion({
            groupId: group._id,
            questionType: QuestionType.Custom,
            multiSelect: false,
            options: ["A", "B"],
        });
        q.answers.push(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { user: alice._id, response: "A", time: new Date() } as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { user: bob._id, response: "A", time: new Date() } as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { user: charlie._id, response: "B", time: new Date() } as any
        );
        await q.save();

        const result = await getQuestionResults(q._id.toString());

        expect(result.totalVotes).toBe(3);
        expect(result.totalUsers).toBe(3);
        expect(result.results[0].option).toBe("A");
        expect(result.results[0].count).toBe(2);
        expect(result.results[0].users.map((u) => u.username).sort()).toEqual(["Alice", "Bob"]);
        expect(result.results[1].option).toBe("B");
        expect(result.results[1].count).toBe(1);
    });

    it("throws NotFoundError when question not found", async () => {
        await expect(getQuestionResults(new Types.ObjectId().toString())).rejects.toThrow(
            NotFoundError
        );
    });

    it("handles array responses (multi-select)", async () => {
        const user = await makeUser({ username: "Alice" });
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "Alice" }],
        });
        const q = await makeQuestion({
            groupId: group._id,
            multiSelect: true,
            options: ["A", "B"],
        });
        q.answers.push(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { user: user._id, response: ["A", "B"], time: new Date() } as any
        );
        await q.save();

        const result = await getQuestionResults(q._id.toString());

        expect(result.totalVotes).toBe(1);
        expect(result.results).toHaveLength(2);
    });

    it("returns pairing results for pairing questions", async () => {
        const u1 = await makeUser({ username: "User1" });
        const u2 = await makeUser({ username: "User2" });
        const group = await makeGroup({
            admin: u1._id,
            members: [
                { user: u1._id, name: "User1" },
                { user: u2._id, name: "User2" },
            ],
        });
        const q = await makeQuestion({
            groupId: group._id,
            questionType: QuestionType.Pairing,
        });
        q.pairing = {
            keySource: PairingKeySource.Custom,
            mode: PairingMode.Exclusive,
            keys: ["Alice", "Bob"],
            values: ["Funny", "Smart"],
        };
        q.answers.push(
            {
                user: u1._id,
                response: { Alice: "Funny", Bob: "Smart" },
                time: new Date(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            {
                user: u2._id,
                response: { Alice: "Smart", Bob: "Funny" },
                time: new Date(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
        );
        await q.save();

        const result = await getQuestionResults(q._id.toString());

        expect(result.pairingResults).toBeDefined();
        expect(result.pairingResults).toHaveLength(2);
        expect(result.results).toEqual([]);

        const aliceResult = result.pairingResults!.find((r) => r.key === "Alice")!;
        expect(aliceResult.valueCounts).toHaveLength(2);
        expect(aliceResult.valueCounts[0].count).toBe(1);
    });
});

describe("updateQuestionAttachments", () => {
    it("attaches an image to a question", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id });

        await updateQuestionAttachments(group._id.toString(), q._id.toString(), {
            imageKey: "group1/question/q1/img.jpg",
        });

        const reloaded = await Question.findById(q._id);
        expect(reloaded?.image).toBe("group1/question/q1/img.jpg");
    });

    it("attaches options to a question", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id });

        await updateQuestionAttachments(group._id.toString(), q._id.toString(), {
            options: ["X", "Y", "Z"],
        });

        const reloaded = await Question.findById(q._id);
        expect(reloaded?.options).toEqual(["X", "Y", "Z"]);
    });

    it("attaches both image and options in one call", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id });

        await updateQuestionAttachments(group._id.toString(), q._id.toString(), {
            imageKey: "group1/question/q1/img.jpg",
            options: ["A", "B"],
        });

        const reloaded = await Question.findById(q._id);
        expect(reloaded?.image).toBe("group1/question/q1/img.jpg");
        expect(reloaded?.options).toEqual(["A", "B"]);
    });

    it("throws ValidationError when neither imageKey nor options provided", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id });

        await expect(
            updateQuestionAttachments(group._id.toString(), q._id.toString(), {})
        ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when options is empty array", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q = await makeQuestion({ groupId: group._id });

        await expect(
            updateQuestionAttachments(group._id.toString(), q._id.toString(), { options: [] })
        ).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when question not found", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });

        await expect(
            updateQuestionAttachments(group._id.toString(), new Types.ObjectId().toString(), {
                imageKey: "group1/question/q1/img.jpg",
            })
        ).rejects.toThrow(NotFoundError);
    });
});

describe("activateSmartQuestions", () => {
    it("deactivates currently active questions first", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const active = await makeQuestion({ groupId: group._id, active: true, used: true });

        await activateSmartQuestions(group._id);

        const reloaded = await Question.findById(active._id);
        expect(reloaded?.active).toBe(false);
    });

    it("activates one custom + one template question", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });
        const customQ = await makeQuestion({
            groupId: group._id,
            submittedBy: user._id,
            used: false,
            active: false,
        });
        const templateQ = await makeQuestion({
            groupId: group._id,
            submittedBy: undefined,
            used: false,
            active: false,
        });

        const result = await activateSmartQuestions(group._id);

        expect(result).toHaveLength(2);
        const customReloaded = await Question.findById(customQ._id);
        const templateReloaded = await Question.findById(templateQ._id);
        expect(customReloaded?.active).toBe(true);
        expect(customReloaded?.used).toBe(true);
        expect(templateReloaded?.active).toBe(true);
    });

    it("returns empty array when no questions available", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });

        const result = await activateSmartQuestions(group._id);

        expect(result).toHaveLength(0);
    });
});

describe("deactivateCurrentQuestions", () => {
    it("sets active=false on all active questions for group", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const q1 = await makeQuestion({ groupId: group._id, active: true });
        const q2 = await makeQuestion({ groupId: group._id, active: true });

        await deactivateCurrentQuestions(group._id);

        const r1 = await Question.findById(q1._id);
        const r2 = await Question.findById(q2._id);
        expect(r1?.active).toBe(false);
        expect(r2?.active).toBe(false);
    });

    it("does nothing when no active questions", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });

        await expect(deactivateCurrentQuestions(group._id)).resolves.toBeUndefined();
    });
});

describe("parseVoteResponse", () => {
    it("accepts a string", () => {
        expect(parseVoteResponse("hello")).toEqual(["hello"]);
    });

    it("accepts an array of strings", () => {
        expect(parseVoteResponse(["a", "b"])).toEqual(["a", "b"]);
    });

    it("trims values and drops empty strings", () => {
        expect(parseVoteResponse(["  a  ", " ", "\n", "b"])).toEqual(["a", "b"]);
    });

    it("throws ValidationError when response is not a string or string[]", () => {
        expect(() => parseVoteResponse({})).toThrow(ValidationError);
        expect(() => parseVoteResponse([1 as unknown as string])).toThrow(ValidationError);
    });

    it("throws ValidationError when response is empty", () => {
        expect(() => parseVoteResponse([])).toThrow(ValidationError);
        expect(() => parseVoteResponse(["  "])).toThrow(ValidationError);
    });

    it("accepts pairing Record for pairing question type", () => {
        const result = parseVoteResponse({ Alice: "Funny", Bob: "Smart" }, QuestionType.Pairing);
        expect(result).toEqual({ Alice: "Funny", Bob: "Smart" });
    });

    it("throws ValidationError for pairing with non-object response", () => {
        expect(() => parseVoteResponse("hello", QuestionType.Pairing)).toThrow(ValidationError);
    });

    it("throws ValidationError for pairing with empty object", () => {
        expect(() => parseVoteResponse({}, QuestionType.Pairing)).toThrow(ValidationError);
    });
});
