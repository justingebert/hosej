import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import Chat from "@/db/models/Chat";
import User from "@/db/models/User";
import { isUserInGroup } from "@/lib/userAuth";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError } from "@/lib/api/errorHandling";

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; chatId: string };
        }>
    ) => {
        const { groupId, chatId } = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const chat = await Chat.findById(chatId).populate({ path: "messages.user", model: User });
        if (!chat) {
            throw new NotFoundError("Chat not found");
        }

        return NextResponse.json(chat, { status: 200 });
    }
);
