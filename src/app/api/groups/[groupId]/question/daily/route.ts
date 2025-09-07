import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import {NextRequest, NextResponse} from "next/server";
import {isUserInGroup} from "@/lib/groupAuth";
import {generateSignedUrl} from "@/lib/question/questionOptions";
import Group from "@/db/models/Group";
import mongoose from "mongoose";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";
import {ForbiddenError} from "@/lib/api/errorHandling";

export const revalidate = 0;

// Return active daily questions
export const GET = withAuthAndErrors(async (req: NextRequest, {params, userId}: AuthedContext<{
    params: { groupId: string }
}>) => {
    const {groupId} = params;

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        throw new ForbiddenError(authCheck.message || 'Forbidden');
    }
    await dbConnect();

    let questions = await Question.find({
        groupId: groupId,
        category: "Daily",
        used: true,
        active: true,
    }).lean();

    if (!questions || questions.length === 0) {
        return NextResponse.json({questions: [], message: "No questions available"});
    }

    const group = await Group.findById(groupId);
    const userCount = group.members.length;
    const totalVotes = questions.reduce(
        (acc, question) => acc + (question.answers?.length || 0),
        0
    );
    const completionPercentage = ((totalVotes / (questions.length * userCount)) * 100).toFixed(
        0
    );

    questions = questions.map((question) => {
        question.userHasVoted = question.answers.some(
            (answer: { user: string }) => answer.user.toString() === userId
        );
        question.userRating = question.rating.good.some((id: mongoose.Types.ObjectId) => id.toString() === userId)
            ? "good"
            : question.rating.ok.some((id: mongoose.Types.ObjectId) => id.toString() === userId)
                ? "ok"
                : question.rating.bad.some((id: mongoose.Types.ObjectId) => id.toString() === userId)
                    ? "bad"
                    : null;
        return question;
    });

    const questionsWithImages = await Promise.all(
        questions.map(async (question) => {
            if (question.image) {
                const {url} = await generateSignedUrl(new URL(question.image).pathname);
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

    return NextResponse.json({questions: questionsWithImages, completionPercentage});
});
