import { type NextRequest, NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/services/group";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { rateQuestion } from "@/lib/services/question";
import { parseBody } from "@/lib/validation/parseBody";
import { RateQuestionSchema } from "@/lib/validation/question";

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string; questionId: string } }>
    ) => {
        const { groupId, questionId } = params;
        await isUserInGroup(userId, groupId);

        const { rating } = await parseBody(req, RateQuestionSchema);
        const result = await rateQuestion(questionId, userId, rating);

        return NextResponse.json(result);
    }
);
