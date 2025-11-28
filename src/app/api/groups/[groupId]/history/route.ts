import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import { type NextRequest, NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/userAuth";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";
import { ValidationError } from "@/lib/api/errorHandling";

export const revalidate = 0;
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
        const {groupId} = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const searchParams = req.nextUrl.searchParams;
        const limitStr = searchParams.get("limit");
        const offsetStr = searchParams.get("offset");
        if (!limitStr || !offsetStr) {
            throw new ValidationError("limit and offset are required");
        }
        const limit = parseInt(limitStr, 10);
        const offset = parseInt(offsetStr, 10);

        const questions = await Question.find({
            groupId: groupId,
            used: true,
            active: false,
            category: "Daily",
        })
            .skip(offset)
            .limit(limit)
            .sort({createdAt: -1});

        if (!questions) {
            return NextResponse.json({message: "No questions available"});
        }

        return NextResponse.json({questions});
    }
);
