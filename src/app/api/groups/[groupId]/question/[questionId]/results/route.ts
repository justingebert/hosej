import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/services/group";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getQuestionResults } from "@/lib/services/question";

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string; questionId: string } }>
    ) => {
        const { groupId, questionId } = params;
        await isUserInGroup(userId, groupId);

        const results = await getQuestionResults(questionId);

        return NextResponse.json(results, { status: 200 });
    }
);
