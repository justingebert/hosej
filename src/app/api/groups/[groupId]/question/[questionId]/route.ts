import { type NextRequest, NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/services/group";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getQuestionById, updateQuestionAttachments } from "@/lib/services/question";

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string; questionId: string } }>
    ) => {
        const { questionId, groupId } = params;
        await isUserInGroup(userId, groupId);

        const question = await getQuestionById(groupId, questionId);

        return NextResponse.json(question);
    }
);

export const PATCH = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string; questionId: string } }>
    ) => {
        const { groupId, questionId } = params;
        await isUserInGroup(userId, groupId);

        const data = await req.json();
        await updateQuestionAttachments(groupId, questionId, data);

        return NextResponse.json({ message: "Question updated" });
    }
);
