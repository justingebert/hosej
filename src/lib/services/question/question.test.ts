import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Types } from "mongoose";

vi.mock("@/db/models/Question");
vi.mock("@/db/models/Group");
vi.mock("@/db/models/User");
vi.mock("@/lib/generateSingledUrl");
vi.mock("@/lib/services/chat");

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
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import { createChatForEntity } from "@/lib/services/chat";
import { generateSignedUrl } from "@/lib/generateSingledUrl";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { QuestionType } from "@/types/models/question";

const mockUserId = new Types.ObjectId().toString();
const mockGroupId = new Types.ObjectId().toString();
const mockQuestionId = new Types.ObjectId().toString();
const mockChatId = new Types.ObjectId();

function createMockQuestion(overrides: Record<string, any> = {}) {
    return {
        _id: new Types.ObjectId(mockQuestionId),
        groupId: new Types.ObjectId(mockGroupId),
        category: "general",
        questionType: QuestionType.CustomSelectOne,
        question: "Test question?",
        image: "",
        options: ["A", "B", "C"],
        answers: [] as any[],
        rating: { good: [] as any[], ok: [] as any[], bad: [] as any[] },
        used: false,
        active: false,
        usedAt: null,
        submittedBy: null,
        chat: mockChatId,
        createdAt: new Date(),
        save: vi.fn().mockResolvedValue(undefined),
        toObject: vi.fn().mockReturnThis(),
        ...overrides,
    };
}

function createMockGroup(overrides = {}) {
    return {
        _id: new Types.ObjectId(mockGroupId),
        name: "Test Group",
        members: [
            { user: new Types.ObjectId(mockUserId), name: "User1" },
            { user: new Types.ObjectId(), name: "User2" },
        ],
        addPoints: vi.fn().mockResolvedValue(undefined),
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

/** Sets up Question constructor mock + createChatForEntity mock. */
function mockConstructors(questionOverrides = {}) {
    const mockQuestion = createMockQuestion(questionOverrides);
    const mockChat = { _id: mockChatId, save: vi.fn().mockResolvedValue(undefined) };

    vi.mocked(Question).mockImplementation(function (this: any, data: any) {
        Object.assign(this, mockQuestion, data);
        return this;
    } as any);
    (createChatForEntity as Mock).mockResolvedValue(mockChat);

    return { mockQuestion, mockChat };
}

beforeEach(() => {
    vi.clearAllMocks();
    (generateSignedUrl as Mock).mockResolvedValue({ key: "test-key", url: "https://signed.url" });
});

// ─── createQuestion ─────────────────────────────────────────────────────────

describe("createQuestion", () => {
    it("should create a question with a linked chat and award points", async () => {
        const { mockQuestion, mockChat } = mockConstructors();
        const mockGroup = createMockGroup();
        (Group.findById as Mock).mockReturnValue({ orFail: () => mockGroup });

        const result = await createQuestion(mockGroupId, mockUserId, {
            category: "general",
            questionType: QuestionType.CustomSelectOne,
            question: "Test?",
            submittedBy: mockUserId,
            options: ["A", "B"],
        });

        expect(mockQuestion.save).toHaveBeenCalled();
        expect(createChatForEntity).toHaveBeenCalled();
        expect(mockGroup.addPoints).toHaveBeenCalledWith(mockUserId, expect.any(Number));
        expect(result).toBeDefined();
    });

    it("should throw ValidationError when required fields are missing", async () => {
        await expect(
            createQuestion(mockGroupId, mockUserId, {
                category: "",
                questionType: QuestionType.CustomSelectOne,
                question: "Test?",
                submittedBy: mockUserId,
            })
        ).rejects.toThrow(ValidationError);
    });

    it("should auto-generate 1-10 options for rating type", async () => {
        const savedData: Record<string, unknown> = {};
        vi.mocked(Question).mockImplementation(function (this: any, data: any) {
            Object.assign(savedData, data);
            Object.assign(this, createMockQuestion(), data, savedData);
            return this;
        } as any);
        (createChatForEntity as Mock).mockResolvedValue({
            _id: mockChatId,
            save: vi.fn().mockResolvedValue(undefined),
        });
        (Group.findById as Mock).mockReturnValue({ orFail: () => createMockGroup() });

        await createQuestion(mockGroupId, mockUserId, {
            category: "fun",
            questionType: QuestionType.Rating,
            question: "Rate this?",
            submittedBy: mockUserId,
        });

        expect(savedData.options).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    });
});

// ─── createQuestionFromTemplate ─────────────────────────────────────────────

describe("createQuestionFromTemplate", () => {
    it("should create a question without awarding points", async () => {
        mockConstructors();

        const result = await createQuestionFromTemplate(
            mockGroupId,
            "general",
            QuestionType.CustomSelectOne,
            "Template Q?",
            "",
            ["A", "B"],
            new Types.ObjectId()
        );

        expect(result).toBeDefined();
        expect(Group.findById).not.toHaveBeenCalled();
    });
});

// ─── getActiveQuestions ─────────────────────────────────────────────────────

describe("getActiveQuestions", () => {
    it("should return empty array when no active questions", async () => {
        (Question.find as Mock).mockReturnValue({ lean: () => [] });

        const result = await getActiveQuestions(mockGroupId, mockUserId);

        expect(result.questions).toEqual([]);
        expect(result.completionPercentage).toBe(0);
    });

    it("should return questions with userHasVoted and userRating", async () => {
        const questions = [
            {
                ...createMockQuestion({ active: true, used: true }),
                answers: [
                    { user: new Types.ObjectId(mockUserId), response: "A", time: new Date() },
                ],
                rating: { good: [new Types.ObjectId(mockUserId)], ok: [], bad: [] },
            },
        ];
        (Question.find as Mock).mockReturnValue({ lean: () => questions });
        (Group.findById as Mock).mockReturnValue({ orFail: () => createMockGroup() });

        const result = await getActiveQuestions(mockGroupId, mockUserId);

        expect(result.questions).toHaveLength(1);
        expect(result.questions[0]).toMatchObject({
            userHasVoted: true,
            userRating: "good",
        });
    });

    it("should calculate completion percentage", async () => {
        const questions = [
            {
                ...createMockQuestion({ active: true, used: true }),
                answers: [
                    { user: new Types.ObjectId(mockUserId), response: "A", time: new Date() },
                    { user: new Types.ObjectId(), response: "B", time: new Date() },
                ],
                rating: { good: [], ok: [], bad: [] },
            },
        ];
        (Question.find as Mock).mockReturnValue({ lean: () => questions });
        (Group.findById as Mock).mockReturnValue({ orFail: () => createMockGroup() });

        const result = await getActiveQuestions(mockGroupId, mockUserId);

        // 2 votes / (1 question * 2 members) = 100%
        expect(result.completionPercentage).toBe(100);
    });
});

// ─── getQuestionById ────────────────────────────────────────────────────────

describe("getQuestionById", () => {
    it("should return question when found", async () => {
        const mockQuestion = createMockQuestion();
        mockQuestion.toObject = vi.fn().mockReturnValue({ ...mockQuestion, image: "" });
        (Question.findOne as Mock).mockResolvedValue(mockQuestion);

        const result = await getQuestionById(mockGroupId, mockQuestionId);

        expect(result).toBeDefined();
        expect(Question.findOne).toHaveBeenCalledWith({
            groupId: mockGroupId,
            _id: mockQuestionId,
        });
    });

    it("should throw NotFoundError when question not found", async () => {
        (Question.findOne as Mock).mockResolvedValue(null);

        await expect(getQuestionById(mockGroupId, mockQuestionId)).rejects.toThrow(NotFoundError);
    });

    it("should generate signed URL for image questions", async () => {
        const mockQuestion = createMockQuestion({ image: "https://s3.example.com/image.jpg" });
        mockQuestion.toObject = vi.fn().mockReturnValue({
            ...mockQuestion,
            image: "https://s3.example.com/image.jpg",
            questionType: QuestionType.CustomSelectOne,
        });
        (Question.findOne as Mock).mockResolvedValue(mockQuestion);

        const result = await getQuestionById(mockGroupId, mockQuestionId);

        expect(generateSignedUrl).toHaveBeenCalled();
        expect(result.imageUrl).toBe("https://signed.url");
    });
});

// ─── voteOnQuestion ─────────────────────────────────────────────────────────

describe("voteOnQuestion", () => {
    it("should submit a vote and award points", async () => {
        const mockUser = { _id: new Types.ObjectId(mockUserId), username: "testuser" };
        const mockQuestion = createMockQuestion({ answers: [] });
        const mockGroup = createMockGroup();

        (Question.findById as Mock).mockResolvedValue(mockQuestion);
        (User.findById as Mock).mockResolvedValue(mockUser);
        (Question.findByIdAndUpdate as Mock).mockResolvedValue(mockQuestion);
        (Group.findById as Mock).mockResolvedValue(mockGroup);

        const result = await voteOnQuestion(mockGroupId, mockQuestionId, mockUserId, "A");

        expect(result.alreadyVoted).toBe(false);
        expect(Question.findByIdAndUpdate).toHaveBeenCalledWith(
            mockQuestionId,
            expect.objectContaining({ $push: expect.any(Object) }),
            expect.any(Object)
        );
        expect(mockGroup.addPoints).toHaveBeenCalled();
    });

    it("should return alreadyVoted=true when user already voted", async () => {
        const userOid = new Types.ObjectId(mockUserId);
        const mockQuestion = createMockQuestion({
            answers: [{ user: userOid, response: "A", time: new Date() }],
        });
        mockQuestion.answers[0].user.equals = (id: Types.ObjectId) =>
            id.toString() === userOid.toString();

        (Question.findById as Mock).mockResolvedValue(mockQuestion);
        (User.findById as Mock).mockResolvedValue({ _id: userOid });

        const result = await voteOnQuestion(mockGroupId, mockQuestionId, mockUserId, "B");

        expect(result.alreadyVoted).toBe(true);
        expect(Question.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when question not found", async () => {
        (Question.findById as Mock).mockResolvedValue(null);

        await expect(voteOnQuestion(mockGroupId, mockQuestionId, mockUserId, "A")).rejects.toThrow(
            NotFoundError
        );
    });

    it("should throw ValidationError for invalid response", async () => {
        await expect(voteOnQuestion(mockGroupId, mockQuestionId, mockUserId, 123)).rejects.toThrow(
            ValidationError
        );
    });
});

// ─── rateQuestion ───────────────────────────────────────────────────────────

describe("rateQuestion", () => {
    it("should add a new rating", async () => {
        const mockQuestion = createMockQuestion();
        (Question.findById as Mock).mockResolvedValue(mockQuestion);

        const result = await rateQuestion(mockQuestionId, mockUserId, "good");

        expect(result.previousRating).toBeNull();
        expect(result.newRating).toBe("good");
        expect(mockQuestion.rating.good).toHaveLength(1);
        expect(mockQuestion.save).toHaveBeenCalled();
    });

    it("should change rating from good to ok", async () => {
        const userOid = new Types.ObjectId(mockUserId);
        userOid.equals = (id: Types.ObjectId) => id.toString() === mockUserId;

        const mockQuestion = createMockQuestion({
            rating: { good: [userOid], ok: [], bad: [] },
        });
        (Question.findById as Mock).mockResolvedValue(mockQuestion);

        const result = await rateQuestion(mockQuestionId, mockUserId, "ok");

        expect(result.previousRating).toBe("good");
        expect(result.newRating).toBe("ok");
        expect(mockQuestion.rating.good).toHaveLength(0);
        expect(mockQuestion.rating.ok).toHaveLength(1);
        expect(mockQuestion.save).toHaveBeenCalled();
    });

    it("should handle re-submitting the same rating", async () => {
        const userOid = new Types.ObjectId(mockUserId);
        userOid.equals = (id: Types.ObjectId) => id.toString() === mockUserId;

        const mockQuestion = createMockQuestion({
            rating: { good: [], ok: [userOid], bad: [] },
        });
        (Question.findById as Mock).mockResolvedValue(mockQuestion);

        const result = await rateQuestion(mockQuestionId, mockUserId, "ok");

        expect(result.previousRating).toBe("ok");
        expect(result.newRating).toBe("ok");
        expect(mockQuestion.rating.ok).toHaveLength(1);
        expect(mockQuestion.save).toHaveBeenCalled();
    });

    it("should throw ValidationError for invalid rating", async () => {
        await expect(rateQuestion(mockQuestionId, mockUserId, "excellent")).rejects.toThrow(
            ValidationError
        );
    });

    it("should throw NotFoundError when question not found", async () => {
        (Question.findById as Mock).mockResolvedValue(null);

        await expect(rateQuestion(mockQuestionId, mockUserId, "good")).rejects.toThrow(
            NotFoundError
        );
    });
});

// ─── getQuestionResults ─────────────────────────────────────────────────────

describe("getQuestionResults", () => {
    it("should return aggregated results sorted by count", async () => {
        const mockQuestion = {
            _id: new Types.ObjectId(mockQuestionId),
            groupId: new Types.ObjectId(mockGroupId),
            questionType: QuestionType.CustomSelectOne,
            answers: [
                { user: { username: "Alice" }, response: "A", time: new Date() },
                { user: { username: "Bob" }, response: "A", time: new Date() },
                { user: { username: "Charlie" }, response: "B", time: new Date() },
            ],
        };

        (Question.findById as Mock).mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockQuestion),
        });
        (Group.findById as Mock).mockReturnValue({ orFail: () => createMockGroup() });

        const result = await getQuestionResults(mockQuestionId);

        expect(result.totalVotes).toBe(3);
        expect(result.totalUsers).toBe(2);
        expect(result.results[0].option).toBe("A");
        expect(result.results[0].count).toBe(2);
        expect(result.results[0].users).toEqual(["Alice", "Bob"]);
        expect(result.results[1].option).toBe("B");
        expect(result.results[1].count).toBe(1);
    });

    it("should throw NotFoundError when question not found", async () => {
        (Question.findById as Mock).mockReturnValue({
            populate: vi.fn().mockResolvedValue(null),
        });

        await expect(getQuestionResults(mockQuestionId)).rejects.toThrow(NotFoundError);
    });

    it("should handle array responses (multi-select)", async () => {
        const mockQuestion = {
            _id: new Types.ObjectId(mockQuestionId),
            groupId: new Types.ObjectId(mockGroupId),
            questionType: QuestionType.CustomSelectMultiple,
            answers: [{ user: { username: "Alice" }, response: ["A", "B"], time: new Date() }],
        };

        (Question.findById as Mock).mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockQuestion),
        });
        (Group.findById as Mock).mockReturnValue({ orFail: () => createMockGroup() });

        const result = await getQuestionResults(mockQuestionId);

        expect(result.totalVotes).toBe(1);
        expect(result.results).toHaveLength(2);
    });
});

// ─── updateQuestionAttachments ──────────────────────────────────────────────

describe("updateQuestionAttachments", () => {
    it("should attach an image to a question", async () => {
        const mockQuestion = createMockQuestion();
        (Question.findOne as Mock).mockResolvedValue(mockQuestion);

        await updateQuestionAttachments(mockGroupId, mockQuestionId, {
            imageUrl: "https://s3.example.com/img.jpg",
        });

        expect(mockQuestion.image).toBe("https://s3.example.com/img.jpg");
        expect(mockQuestion.save).toHaveBeenCalled();
    });

    it("should attach options to a question", async () => {
        const mockQuestion = createMockQuestion();
        (Question.findOne as Mock).mockResolvedValue(mockQuestion);

        await updateQuestionAttachments(mockGroupId, mockQuestionId, {
            options: ["X", "Y", "Z"],
        });

        expect(mockQuestion.options).toEqual(["X", "Y", "Z"]);
        expect(mockQuestion.save).toHaveBeenCalled();
    });

    it("should attach both image and options in one call", async () => {
        const mockQuestion = createMockQuestion();
        (Question.findOne as Mock).mockResolvedValue(mockQuestion);

        await updateQuestionAttachments(mockGroupId, mockQuestionId, {
            imageUrl: "https://s3.example.com/img.jpg",
            options: ["A", "B"],
        });

        expect(mockQuestion.image).toBe("https://s3.example.com/img.jpg");
        expect(mockQuestion.options).toEqual(["A", "B"]);
        expect(mockQuestion.save).toHaveBeenCalledTimes(1);
    });

    it("should throw ValidationError when neither imageUrl nor options provided", async () => {
        await expect(updateQuestionAttachments(mockGroupId, mockQuestionId, {})).rejects.toThrow(
            ValidationError
        );
    });

    it("should throw ValidationError when options is empty array", async () => {
        await expect(
            updateQuestionAttachments(mockGroupId, mockQuestionId, { options: [] })
        ).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError when question not found", async () => {
        (Question.findOne as Mock).mockResolvedValue(null);

        await expect(
            updateQuestionAttachments(mockGroupId, mockQuestionId, {
                imageUrl: "https://s3.example.com/img.jpg",
            })
        ).rejects.toThrow(NotFoundError);
    });
});

// ─── activateSmartQuestions ─────────────────────────────────────────────────

describe("activateSmartQuestions", () => {
    const groupId = new Types.ObjectId(mockGroupId);

    it("should deactivate current questions first", async () => {
        const activeQ = createMockQuestion({ active: true });
        (Question.find as Mock).mockResolvedValue([activeQ]);
        (Question.findOne as Mock).mockReturnValue({
            sort: vi.fn().mockResolvedValue(null),
        });

        await activateSmartQuestions(groupId);

        expect(activeQ.active).toBe(false);
        expect(activeQ.save).toHaveBeenCalled();
    });

    it("should activate one custom + one template question", async () => {
        const customQ = createMockQuestion({ submittedBy: new Types.ObjectId() });
        const templateQ = createMockQuestion({ submittedBy: null });

        (Group.findById as Mock).mockReturnValue({ orFail: () => createMockGroup() });
        (Question.find as Mock).mockResolvedValue([]);
        (Question.findOne as Mock)
            .mockReturnValueOnce({ sort: vi.fn().mockResolvedValue(customQ) })
            .mockReturnValueOnce({ sort: vi.fn().mockResolvedValue(templateQ) });

        const result = await activateSmartQuestions(groupId);

        expect(result).toHaveLength(2);
        expect(customQ.active).toBe(true);
        expect(customQ.used).toBe(true);
        expect(customQ.usedAt).toBeInstanceOf(Date);
        expect(templateQ.active).toBe(true);
    });

    it("should return empty array when no questions available", async () => {
        (Question.find as Mock).mockResolvedValue([]);
        (Question.findOne as Mock).mockReturnValue({
            sort: vi.fn().mockResolvedValue(null),
        });

        const result = await activateSmartQuestions(groupId);

        expect(result).toHaveLength(0);
    });
});

// ─── deactivateCurrentQuestions ─────────────────────────────────────────────

describe("deactivateCurrentQuestions", () => {
    it("should set active=false on all active questions for group", async () => {
        const q1 = createMockQuestion({ active: true });
        const q2 = createMockQuestion({ active: true });
        (Question.find as Mock).mockResolvedValue([q1, q2]);

        await deactivateCurrentQuestions(new Types.ObjectId(mockGroupId));

        expect(q1.active).toBe(false);
        expect(q2.active).toBe(false);
        expect(q1.save).toHaveBeenCalled();
        expect(q2.save).toHaveBeenCalled();
    });

    it("should do nothing when no active questions", async () => {
        (Question.find as Mock).mockResolvedValue([]);

        await deactivateCurrentQuestions(new Types.ObjectId(mockGroupId));

        expect(Question.find).toHaveBeenCalled();
    });
});

// ─── parseVoteResponse ──────────────────────────────────────────────────────

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
});
