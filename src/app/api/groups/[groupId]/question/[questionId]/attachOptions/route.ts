import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isUserInGroup } from "@/lib/services/group";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { attachOptions } from "@/lib/services/question";

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string; questionId: string } }>
    ) => {
        const { groupId, questionId } = params;
        await isUserInGroup(userId, groupId);

        const { options } = await req.json();
        await attachOptions(groupId, questionId, options);

        return NextResponse.json({ message: "Options attached successfully" }, { status: 200 });
    }
);
