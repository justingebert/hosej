import { after } from "next/server";
import Chat from "@/db/models/Chat";
import User from "@/db/models/User";
import Group from "@/db/models/Group";
import type { Types } from "mongoose";
import type { ChatDocument, EntityModel, IMessage } from "@/types/models/chat";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { recordActivity } from "@/lib/services/activity";
import { ActivityFeature, ActivityType } from "@/types/models/activityEvent";
import { notify } from "@/lib/integrations/expoPush";

// One chat push per burst, per chat.
const CHAT_NOTIFY_THROTTLE_MS = 5 * 60 * 1000;

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
 * Get a chat by ID with populated message users, scoped to the requested group.
 */
export async function getChatByIdForGroup(
    groupId: string | Types.ObjectId,
    chatId: string
): Promise<ChatDocument> {
    const chat = await Chat.findOne({ _id: chatId, group: groupId }).populate({
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
    const trimmed = normalizeMessage(message);
    const chat = await Chat.findById(chatId);
    if (!chat) throw new NotFoundError("Chat not found");

    return addMessageToChat(chat, userId, trimmed);
}

export async function addMessageToGroupChat(
    groupId: string | Types.ObjectId,
    chatId: string,
    userId: string,
    message: string
): Promise<IMessage> {
    const trimmed = normalizeMessage(message);
    const chat = await Chat.findOne({ _id: chatId, group: groupId });
    if (!chat) throw new NotFoundError("Chat not found");

    return addMessageToChat(chat, userId, trimmed);
}

function normalizeMessage(message: string): string {
    if (!message || typeof message !== "string" || message.trim() === "") {
        throw new ValidationError("Message is required");
    }
    return message.trim();
}

async function addMessageToChat(
    chat: ChatDocument,
    userId: string,
    trimmed: string
): Promise<IMessage> {
    chat.messages.push({ user: userId, message: trimmed, createdAt: new Date() });

    // Throttle chat pushes to one per burst. Decide before saving so lastNotifiedAt
    // persists in the same write.
    const now = Date.now();
    const last = chat.lastNotifiedAt ? chat.lastNotifiedAt.getTime() : 0;
    const shouldNotify = now - last >= CHAT_NOTIFY_THROTTLE_MS;
    if (shouldNotify) chat.lastNotifiedAt = new Date(now);

    await chat.save();

    const featureMap: Record<string, ActivityFeature> = {
        Question: ActivityFeature.Question,
        Rally: ActivityFeature.Rally,
        Jukebox: ActivityFeature.Jukebox,
    };
    const feature = featureMap[chat.entityModel] ?? ActivityFeature.System;

    // after(): let the response flush, but keep the serverless function alive until
    // this background work finishes. A bare fire-and-forget promise is killed when
    // Vercel freezes the instance post-response — the Expo send never completes.
    after(() =>
        recordActivity({
            groupId: chat.group.toString(),
            actorUser: userId,
            type: ActivityType.ChatMessage,
            feature,
            entityId: chat.entity.toString(),
            meta: { chatId: chat._id.toString() },
        }).catch((err) => console.error("Activity log failed", err))
    );

    if (shouldNotify) {
        after(() =>
            notifyChatMessage(chat, userId, trimmed).catch((err) =>
                console.error("Chat notify failed", err)
            )
        );
    }

    return chat.messages[chat.messages.length - 1];
}

/**
 * Fire-and-forget chat push to every group member except the sender. The
 * `chatMessage` pref + a registered Expo token are both enforced inside notify().
 */
async function notifyChatMessage(
    chat: ChatDocument,
    senderId: string,
    text: string
): Promise<void> {
    const [sender, group] = await Promise.all([
        User.findById(senderId).select("username").lean(),
        Group.findById(chat.group).select("name").lean(),
    ]);
    const senderName = sender?.username ?? "Someone";

    await notify({
        groupId: chat.group,
        excludeUserId: senderId,
        prefKey: "chatMessage",
        title: group?.name ?? "New message",
        body: `${senderName}: ${text}`,
        collapseId: chat._id.toString(),
        data: {
            type: "chat",
            chatId: chat._id.toString(),
            groupId: chat.group.toString(),
            entityModel: chat.entityModel,
            entityId: chat.entity.toString(),
        },
    });
}
