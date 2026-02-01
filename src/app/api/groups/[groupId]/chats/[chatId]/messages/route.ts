import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import Chat from "@/db/models/Chat";
import { isUserInGroup } from "@/lib/userAuth";
import type { AuthedContext} from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";

export const POST = withAuthAndErrors(
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

        const body = await req.json();
        const { message } = body;
        if (!message || typeof message !== "string" || message.trim() === "") {
            throw new ValidationError("Message is required");
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new NotFoundError("Chat not found");
        }
        chat.messages.push({ user: userId, message, createdAt: new Date() });
        await chat.save();

        const newMessage = chat.messages[chat.messages.length - 1];
        return NextResponse.json(newMessage, { status: 201 });
    }
);
