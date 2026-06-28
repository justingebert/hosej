import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { isUserInGroup } from "@/lib/services/group";
import { getChatByIdForGroup } from "@/lib/services/chat";

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string; chatId: string } }>
    ) => {
        const { groupId, chatId } = params;
        await isUserInGroup(userId, groupId);

        const chat = await getChatByIdForGroup(groupId, chatId);

        return NextResponse.json(chat);
    }
);
