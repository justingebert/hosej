import Chat from "@/db/models/Chat";
import User from "@/db/models/User";
import type { Types } from "mongoose";
import type { ChatDocument, EntityModel, IMessage } from "@/types/models/chat";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";

/**
 * Create a chat for any entity (Question, Rally, Jukebox).
 * Used by other services when creating entities — avoids duplicating this pattern.
 */
export async function createChatForEntity(
    groupId: string | Types.ObjectId,
    entityId: Types.ObjectId,
    entityModel: EntityModel
): Promise<ChatDocument> {
    const chat = new Chat({
        group: groupId,
        entity: entityId,
        entityModel,
        messages: [],
    });
    await chat.save();
    return chat;
}

/**
 * Get a chat by ID with populated message users.
 */
export async function getChatById(chatId: string): Promise<ChatDocument> {
    const chat = await Chat.findById(chatId).populate({
        path: "messages.user",
        model: User,
    });
    if (!chat) throw new NotFoundError("Chat not found");
    return chat;
}

/**
 * Add a message to a chat. Returns the newly created message subdocument.
 */
export async function addMessage(
    chatId: string,
    userId: string,
    message: string
): Promise<IMessage> {
    if (!message || typeof message !== "string" || message.trim() === "") {
        throw new ValidationError("Message is required");
    }

    const chat = await Chat.findById(chatId);
    if (!chat) throw new NotFoundError("Chat not found");

    chat.messages.push({ user: userId, message: message.trim(), createdAt: new Date() });
    await chat.save();

    return chat.messages[chat.messages.length - 1];
}
