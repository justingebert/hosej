import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { isUserInGroup } from "@/lib/services/group";
import { addMessage } from "@/lib/services/chat";

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string; chatId: string } }>
    ) => {
        const { groupId, chatId } = params;
        await isUserInGroup(userId, groupId);

        const { message } = await req.json();
        const newMessage = await addMessage(chatId, userId, message);

        return NextResponse.json(newMessage, { status: 201 });
    }
);
