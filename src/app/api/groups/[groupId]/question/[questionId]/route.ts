import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import { type NextRequest, NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/userAuth";
import { generateSignedUrl } from "@/lib/generateSingledUrl";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError } from "@/lib/api/errorHandling";

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; questionId: string };
        }>
    ) => {
        const {questionId, groupId} = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const question = await Question.findOne({groupId, _id: questionId});
        if (!question) throw new NotFoundError("Question not found");

        if (question.image) {
            const {url} = await generateSignedUrl(new URL(question.image).pathname);
            (question as any).imageUrl = url;
        }

        if (question.questionType.startsWith("image")) {
            question.options = await Promise.all(
                question.options.map(async (option: any) => {
                    if (!option.key) throw new Error("Option is empty");
                    return await generateSignedUrl(option.key, 60);
                })
            );
        }

        return NextResponse.json(question);
    }
);
