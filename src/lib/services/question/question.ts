import Question from "@/db/models/Question";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import { Types } from "mongoose";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { generateSignedUrl } from "@/lib/generateSingledUrl";
import { CREATED_QUESTION_POINTS, VOTED_QUESTION_POINTS } from "@/lib/utils/POINT_CONFIG";
import { createChatForEntity } from "@/lib/services/chat";
import { EntityModel } from "@/types/models/chat";
import type { IAnswer, IQuestion, QuestionDocument, UserRating } from "@/types/models/question";
import { QuestionType } from "@/types/models/question";
import type { IUser } from "@/types/models/user";

// ─── Helpers (not exported) ─────────────────────────────────────────────────

async function populateUserOptions(question: QuestionDocument): Promise<QuestionDocument> {
    if (!question.questionType.startsWith("users-")) {
        return question;
    }

    const group = await Group.findById(question.groupId).orFail();
    question.options = group.members.map((member) => member.name);
    await question.save();

    return question;
}

async function activateQuestion(question: QuestionDocument): Promise<void> {
    await populateUserOptions(question);
    question.active = true;
    question.used = true;
    question.usedAt = new Date();
    await question.save();
}

async function resolveSignedImageOptions(options: unknown[]): Promise<unknown[]> {
    return Promise.all(
        options.map(async (option: unknown) => {
            if (typeof option !== "object" || option === null || !("key" in option)) {
                throw new ValidationError("Option is missing a key");
            }

            const { key } = option as { key: unknown };
            if (typeof key !== "string" || key.length === 0) {
                throw new ValidationError("Option key is empty");
            }

            return await generateSignedUrl(key, 60);
        })
    );
}

function getUserRating(rating: IQuestion["rating"], userId: string): UserRating {
    if (rating.good.some((id) => id.toString() === userId)) return "good";
    if (rating.ok.some((id) => id.toString() === userId)) return "ok";
    if (rating.bad.some((id) => id.toString() === userId)) return "bad";
    return null;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function createQuestion(
    groupId: string,
    userId: string,
    data: {
        category: string;
        questionType: QuestionType;
        question: string;
        submittedBy: string;
        image?: string;
        options?: unknown[];
    }
): Promise<IQuestion> {
    const { category, questionType, question, submittedBy, image, options } = data;
    if (!category || !questionType || !question || !submittedBy) {
        throw new ValidationError("Missing required fields");
    }

    let finalOptions = options || [];
    if (questionType === QuestionType.Rating && finalOptions.length === 0) {
        finalOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    }

    const newQuestion = new Question({
        groupId,
        category,
        questionType,
        question,
        image: image || "",
        options: finalOptions,
        submittedBy,
    });
    await newQuestion.save();

    const newChat = await createChatForEntity(groupId, newQuestion._id, EntityModel.Question);
    newQuestion.chat = newChat._id;
    await newQuestion.save();

    const group = await Group.findById(groupId).orFail();
    await group.addPoints(userId, CREATED_QUESTION_POINTS);

    return newQuestion;
}

/**
 * Used internally by addTemplatePackToGroup — no points, no auth, allows templateId.
 */
export async function createQuestionFromTemplate(
    groupId: string | Types.ObjectId,
    category: string,
    questionType: QuestionType,
    question: string,
    image: string,
    options: unknown[] | null | undefined,
    templateId?: Types.ObjectId
): Promise<IQuestion> {
    let finalOptions = options || [];
    if (questionType === QuestionType.Rating && finalOptions.length === 0) {
        finalOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    }

    const newQuestion = new Question({
        groupId,
        category,
        questionType,
        question,
        image,
        options: finalOptions,
        submittedBy: null,
        templateId,
    });
    await newQuestion.save();

    const newChat = await createChatForEntity(groupId, newQuestion._id, EntityModel.Question);
    newQuestion.chat = newChat._id;
    await newQuestion.save();

    return newQuestion;
}

export async function getActiveQuestions(
    groupId: string,
    userId: string
): Promise<{ questions: Record<string, unknown>[]; completionPercentage: number }> {
    const questions = await Question.find({
        groupId,
        used: true,
        active: true,
    }).lean();

    if (!questions || questions.length === 0) {
        return { questions: [], completionPercentage: 0 };
    }

    const group = await Group.findById(groupId).orFail();
    const userCount = group.members.length;
    const totalVotes = questions.reduce((acc, q) => acc + (q.answers?.length || 0), 0);
    const completionPercentage = Math.round((totalVotes / (questions.length * userCount)) * 100);

    const questionsWithState = questions.map((q) => ({
        ...q,
        userHasVoted: q.answers?.some((a) => a.user.toString() === userId) ?? false,
        userRating: getUserRating(q.rating, userId),
    }));

    const questionsWithImages = await Promise.all(
        questionsWithState.map(async (question) => {
            if (question.image) {
                const { url } = await generateSignedUrl(new URL(question.image).pathname);
                question.imageUrl = url;
            }
            if (question.questionType.startsWith("image") && Array.isArray(question.options)) {
                (question as Record<string, unknown>).options = await resolveSignedImageOptions(
                    question.options as unknown[]
                );
            }
            return question;
        })
    );

    return {
        questions: questionsWithImages,
        completionPercentage,
    };
}

export async function getQuestionById(groupId: string, questionId: string): Promise<IQuestion> {
    const question = await Question.findOne({ groupId, _id: questionId });
    if (!question) throw new NotFoundError("Question not found");

    const questionJson = question.toObject();

    if (questionJson.image) {
        const { url } = await generateSignedUrl(new URL(questionJson.image).pathname);
        questionJson.imageUrl = url;
    }

    if (questionJson.questionType.startsWith("image") && Array.isArray(questionJson.options)) {
        questionJson.options = await resolveSignedImageOptions(questionJson.options);
    }

    return questionJson;
}

export async function voteOnQuestion(
    groupId: string,
    questionId: string,
    userId: string,
    rawResponse: unknown
): Promise<{ alreadyVoted: boolean }> {
    const response = parseVoteResponse(rawResponse);

    const question = await Question.findById(questionId);
    if (!question) throw new NotFoundError("Question not found");

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const hasVoted = question.answers.some((answer) => answer.user.equals(user._id));
    if (hasVoted) {
        return { alreadyVoted: true };
    }

    await Question.findByIdAndUpdate(
        questionId,
        { $push: { answers: { user: user._id, response, time: Date.now() } } },
        { new: true, runValidators: true }
    );

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");
    await group.addPoints(user._id.toString(), VOTED_QUESTION_POINTS);

    return { alreadyVoted: false };
}

export async function rateQuestion(
    questionId: string,
    userId: string,
    rating: string
): Promise<{ previousRating: UserRating; newRating: "good" | "ok" | "bad" }> {
    if (!["good", "ok", "bad"].includes(rating)) {
        throw new ValidationError("rating must be one of good | ok | bad");
    }

    const question = await Question.findById(questionId);
    if (!question) throw new NotFoundError("Question not found");

    const userObjectId = new Types.ObjectId(userId);
    const ratingKey = rating as "good" | "ok" | "bad";

    // Find and remove existing rating if any
    const categories = ["good", "ok", "bad"] as const;
    let previousRating: UserRating = null;
    for (const cat of categories) {
        const idx = question.rating[cat].findIndex((id) => id.equals(userObjectId));
        if (idx !== -1) {
            previousRating = cat;
            question.rating[cat].splice(idx, 1);
            break;
        }
    }

    // Add to new category
    question.rating[ratingKey].push(userObjectId);
    await question.save();

    return { previousRating, newRating: ratingKey };
}

export async function getQuestionResults(questionId: string): Promise<{
    results: { option: string; count: number; percentage: number; users: string[] }[];
    totalVotes: number;
    totalUsers: number;
    questionType: QuestionType;
}> {
    type PopulatedAnswer = Omit<IAnswer, "user"> & { user: Pick<IUser, "username"> | null };

    const question = await Question.findById(questionId).populate<{
        answers: PopulatedAnswer[];
    }>({
        path: "answers.user",
        model: User,
        select: "username",
    });

    if (!question) throw new NotFoundError("Question not found");

    const group = await Group.findById(question.groupId).orFail();
    const totalUsers = group.members.length;
    const totalVotes = question.answers.length || 0;

    type VoteDetail = { count: number; users: string[] };
    const voteDetails: Record<string, VoteDetail> = {};

    for (const answer of question.answers) {
        const username = answer.user?.username ?? "Unknown";
        const rawResponses = Array.isArray(answer.response) ? answer.response : [answer.response];

        for (const response of rawResponses) {
            if (typeof response !== "string" || response.length === 0) continue;
            voteDetails[response] = voteDetails[response] || { count: 0, users: [] };
            voteDetails[response].count += 1;
            voteDetails[response].users.push(username);
        }
    }

    const results = await Promise.all(
        Object.entries(voteDetails).map(async ([option, detail]) => {
            const percentage = totalVotes === 0 ? 0 : Math.round((detail.count / totalVotes) * 100);
            let signedOption = option;

            if (question.questionType.startsWith("image")) {
                const { url } = await generateSignedUrl(option);
                signedOption = url;
            }

            return {
                option: signedOption,
                count: detail.count,
                percentage,
                users: detail.users,
            };
        })
    );

    results.sort((a, b) => b.count - a.count);

    return { results, totalVotes, totalUsers, questionType: question.questionType };
}

export async function updateQuestionAttachments(
    groupId: string,
    questionId: string,
    data: { imageUrl?: string; options?: unknown[] }
): Promise<void> {
    if (!data.imageUrl && !data.options) {
        throw new ValidationError("At least one of imageUrl or options is required");
    }
    if (data.options && (!Array.isArray(data.options) || data.options.length === 0)) {
        throw new ValidationError("Options must be a non-empty array");
    }

    const question = await Question.findOne({ groupId, _id: questionId });
    if (!question) throw new NotFoundError("Question not found");

    if (data.imageUrl) {
        question.image = data.imageUrl;
    }
    if (data.options) {
        question.options = data.options;
    }

    await question.save();
}

// ─── Activation (cron) ──────────────────────────────────────────────────────

export async function deactivateCurrentQuestions(groupId: Types.ObjectId): Promise<void> {
    const currentQuestions = await Question.find({ groupId, active: true });
    for (const question of currentQuestions) {
        question.active = false;
        await question.save();
    }
}

/**
 * Smart question activation: activates one custom (user-submitted) question
 * and one template question if available.
 */
export async function activateSmartQuestions(groupId: Types.ObjectId): Promise<IQuestion[]> {
    await deactivateCurrentQuestions(groupId);

    const activatedQuestions: IQuestion[] = [];

    // 1. Custom question (user-submitted)
    const customQuestion = await Question.findOne({
        groupId,
        submittedBy: { $exists: true, $ne: null },
        used: false,
        active: false,
    }).sort({ createdAt: 1 });

    if (customQuestion) {
        await activateQuestion(customQuestion);
        activatedQuestions.push(customQuestion);
    }

    // 2. Template question
    const templateQuestion = await Question.findOne({
        groupId,
        $or: [{ submittedBy: null }, { submittedBy: { $exists: false } }],
        used: false,
        active: false,
    }).sort({ createdAt: 1 });

    if (templateQuestion) {
        await activateQuestion(templateQuestion);
        activatedQuestions.push(templateQuestion);
    }

    return activatedQuestions;
}

// ─── Vote parsing ───────────────────────────────────────────────────────────

export function parseVoteResponse(response: unknown): string[] {
    const rawResponses =
        typeof response === "string"
            ? [response]
            : Array.isArray(response) && response.every((r) => typeof r === "string")
              ? response
              : null;

    if (!rawResponses) {
        throw new ValidationError("response must be a string or an array of strings");
    }

    const normalized = rawResponses.map((r) => r.trim()).filter((r) => r.length > 0);
    if (normalized.length === 0) {
        throw new ValidationError("response is required");
    }

    return normalized;
}
