import { type NextRequest, NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/services/group";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { rateQuestion } from "@/lib/services/question";

export const revalidate = 0;

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string; questionId: string } }>
    ) => {
        const { groupId, questionId } = params;
        await isUserInGroup(userId, groupId);

        const data = await req.json();
        const { alreadyRated } = await rateQuestion(questionId, userId, data.rating);

        if (alreadyRated) {
            return NextResponse.json({ message: "User already rated" }, { status: 304 });
        }

        return NextResponse.json({ message: "Rating added" });
    }
);
