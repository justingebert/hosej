import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/services/group";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { voteOnQuestion } from "@/lib/services/question";
import { parseBody } from "@/lib/validation/parseBody";
import { VoteOnQuestionSchema } from "@/lib/validation/question";

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string; questionId: string } }>
    ) => {
        const { groupId, questionId } = params;
        await isUserInGroup(userId, groupId);

        const { response } = await parseBody(req, VoteOnQuestionSchema);
        const { alreadyVoted } = await voteOnQuestion(groupId, questionId, userId, response);

        if (alreadyVoted) {
            return NextResponse.json({ message: "You have already voted" }, { status: 409 });
        }

        return NextResponse.json({ message: "Vote submitted" }, { status: 200 });
    }
);
