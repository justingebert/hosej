import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import { type NextRequest, NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/userAuth";
import type { AuthedContext} from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { Types } from "mongoose";

export const revalidate = 0;

// Handle rating update
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
        const { groupId, questionId } = params;

        await dbConnect();

        await isUserInGroup(userId, groupId);

        const data = await req.json();
        const { rating } = data as { rating: "good" | "ok" | "bad" };
        if (!["good", "ok", "bad"].includes(rating)) {
            throw new ValidationError("rating must be one of good | ok | bad");
        }

        const question = await Question.findById(questionId);
        if (!question) {
            throw new NotFoundError("Question not found");
        }

        const userObjectId = new Types.ObjectId(userId);

        const alreadyRated =
            question.rating.good.some((id) => id.equals(userObjectId)) ||
            question.rating.ok.some((id) => id.equals(userObjectId)) ||
            question.rating.bad.some((id) => id.equals(userObjectId));

        if (alreadyRated) {
            return NextResponse.json({ message: "User already rated" }, { status: 304 });
        }

        question.rating[rating].push(userObjectId);
        await question.save();

        return NextResponse.json({ message: "Rating added" });
    }
);
