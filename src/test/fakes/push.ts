import type { Types } from "mongoose";
import { DEFAULT_NOTIFICATION_LANGUAGE, DEFAULT_NOTIFICATION_STYLE } from "@/types/models/user";
import {
    renderNotification,
    type NotificationContext,
    type NotificationEvent,
} from "@/lib/notifications/templates";

export type PushCall = {
    event: NotificationEvent;
    context: NotificationContext;
    groupId: string | Types.ObjectId;
    userIds?: (string | Types.ObjectId)[];
    // Rendered with default prefs (en/default) for assertion convenience.
    title: string;
    body: string;
};

const calls: PushCall[] = [];

export async function sendNotification({
    event,
    context,
    groupId = "",
    userIds,
}: {
    event: NotificationEvent;
    context: NotificationContext;
    groupId?: string | Types.ObjectId;
    userIds?: (string | Types.ObjectId)[];
}) {
    const { title, body } = renderNotification(
        event,
        DEFAULT_NOTIFICATION_LANGUAGE,
        DEFAULT_NOTIFICATION_STYLE,
        context
    );
    calls.push({ event, context, groupId, userIds, title, body });
    return { success: true, successCount: 1, failureCount: 0 };
}

export function getPushCalls(): ReadonlyArray<PushCall> {
    return calls;
}

export function resetPushFake() {
    calls.length = 0;
}
