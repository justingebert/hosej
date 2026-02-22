import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import { type NextRequest, NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/services/admin";
import { generateSignedUrl } from "@/lib/generateSingledUrl";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
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
        const { questionId, groupId } = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const question = await Question.findOne({ groupId, _id: questionId });
        if (!question) throw new NotFoundError("Question not found");

        const questionJson = question.toObject();

        if (questionJson.image) {
            const { url } = await generateSignedUrl(new URL(questionJson.image).pathname);
            questionJson.imageUrl = url;
        }

        if (questionJson.questionType.startsWith("image") && Array.isArray(questionJson.options)) {
            questionJson.options = await Promise.all(
                questionJson.options.map(async (option: unknown) => {
                    if (typeof option !== "object" || option === null || !("key" in option)) {
                        throw new Error("Option is empty");
                    }

                    const { key } = option as { key: unknown };
                    if (typeof key !== "string" || key.length === 0) {
                        throw new Error("Option key is empty");
                    }

                    return await generateSignedUrl(key, 60);
                })
            );
        }

        return NextResponse.json(questionJson);
    }
);
