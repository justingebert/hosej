import { type NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { isUserInGroup } from "@/lib/services/group";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { activateSmartQuestions } from "@/lib/services/question";

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const { groupId } = params;
        await isUserInGroup(userId, groupId);

        const activated = await activateSmartQuestions(new Types.ObjectId(groupId));

        return NextResponse.json({ activated: activated.length }, { status: 200 });
    }
);
