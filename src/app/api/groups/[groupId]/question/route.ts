import { type NextRequest, NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/services/group";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { createQuestion, getActiveQuestions } from "@/lib/services/question";

export const revalidate = 0;

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: { params: { groupId: string }; userId: string }
    ) => {
        const { groupId } = params;
        await isUserInGroup(userId, groupId);

        const data = await req.json();
        const newQuestion = await createQuestion(groupId, userId, data);

        return NextResponse.json({ newQuestion }, { status: 201 });
    }
);

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const { groupId } = params;
        await isUserInGroup(userId, groupId);

        const result = await getActiveQuestions(groupId, userId);

        return NextResponse.json(result);
    }
);
