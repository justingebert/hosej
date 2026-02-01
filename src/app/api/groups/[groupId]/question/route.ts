import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import { type NextRequest, NextResponse } from "next/server";
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/userAuth";
import { CREATED_QUESTION_POINTS } from "@/config/POINT_CONFIG";
import { ValidationError } from "@/lib/api/errorHandling";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";
import { generateSignedUrl } from "@/lib/generateSingledUrl";
import { QuestionDTO } from "@/types/models/question";
import { createQuestionInGroup } from "@/lib/question/createQuestion";

export const revalidate = 0;

export const POST = withAuthAndErrors(
    async (req: NextRequest, { params, userId }: { params: { groupId: string }; userId: string }) => {
        const { groupId } = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const data = await req.json();
        const { category, questionType, question, submittedBy, image } = data;
        if (!groupId || !category || !questionType || !question || !submittedBy) {
            throw new ValidationError("Missing required fields");
        }

        let options = data.options || [];

        const newQuestion = await createQuestionInGroup(
            groupId,
            category,
            questionType,
            question,
            image,
            options,
            submittedBy
        );

        const group = await Group.findById(groupId).orFail();
        await group.addPoints(userId, CREATED_QUESTION_POINTS);

        return NextResponse.json({ newQuestion }, { status: 201 });
    }
);

type UserRating = "good" | "ok" | "bad" | null;

type QuestionWithUserState = QuestionDTO & {
    userHasVoted: boolean;
    userRating: UserRating;
};

// Return active questions
export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string };
        }>
    ) => {
        const { groupId } = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        let questions = await Question.find({
            groupId: groupId,
            used: true,
            active: true,
        }).lean();

        if (!questions || questions.length === 0) {
            return NextResponse.json({ questions: [], message: "No questions available" });
        }

        const group = await Group.findById(groupId).orFail();
        const userCount = group.members.length;
        const totalVotes = questions.reduce((acc, question) => acc + (question.answers?.length || 0), 0);
        const completionPercentage = ((totalVotes / (questions.length * userCount)) * 100).toFixed(0);

        const questionsPopulated = questions.map((q) => {
            const userHasVoted = q.answers?.some((a) => a.user.toString() === userId) ?? false;

            const userRating: UserRating = q.rating.good.some((id) => id.toString() === userId)
                ? "good"
                : q.rating.ok.some((id) => id.toString() === userId)
                    ? "ok"
                    : q.rating.bad.some((id) => id.toString() === userId)
                        ? "bad"
                        : null;

            // return a new object with computed fields
            return { ...q, userHasVoted, userRating };
        });

        const questionsWithImages = await Promise.all(
            questionsPopulated.map(async (question) => {
                if (question.image) {
                    const { url } = await generateSignedUrl(new URL(question.image).pathname);
                    question.imageUrl = url;
                }
                if (question.questionType.startsWith("image")) {
                    question.options = await Promise.all(
                        question.options.map(async (option: any) => {
                            if (!option.key) throw new Error("Option is empty");
                            return await generateSignedUrl(option.key, 60);
                        })
                    );
                }
                return question;
            })
        );

        return NextResponse.json({ questions: questionsWithImages, completionPercentage });
    }
);
