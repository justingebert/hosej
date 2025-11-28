import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import { isUserInGroup } from "@/lib/userAuth";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; questionId: string };
        }>
    ) => {
        const {groupId, questionId} = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);
        const {imageUrl} = await req.json();
        if (!imageUrl) {
            throw new ValidationError("Image URL is required");
        }
        const question = await Question.findOne({groupId, _id: questionId});
        if (!question) {
            throw new NotFoundError("Question not found");
        }

        question.image = imageUrl;
        await question.save();

        return NextResponse.json({message: "Image attached successfully"});
    }
);
