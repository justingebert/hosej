import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import type { Types } from "mongoose";
import dbConnect from "@/db/dbConnect";
import User from "@/db/models/User";
import PushToken from "@/db/models/PushToken";
import { env } from "@/env";
import {
    DEFAULT_NOTIFICATION_LANGUAGE,
    DEFAULT_NOTIFICATION_STYLE,
    type NotificationLanguage,
    type NotificationPrefKey,
    type NotificationStyle,
} from "@/types/models/user";
import {
    renderNotification,
    type NotificationContext,
    type NotificationEvent,
} from "@/lib/notifications/templates";

/**
 * Mobile push transport (Expo Push Service). Isolated from the legacy web FCM
 * `sendNotification` — audiences are disjoint by token type, so the two run side by
 * side until web is deprecated, then this whole module + the PushToken collection
 * can be deleted on its own.
 */

const expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN });

type Id = string | Types.ObjectId;

type NotifyAudience = {
    /** Restrict to members of this group (matches User.groups). */
    groupId?: Id;
    /** Restrict to these users (intersected with groupId when both are given). */
    userIds?: Id[];
    /** Never notify this user (e.g. the chat sender). */
    excludeUserId?: Id;
    /** Per-user opt-out: users with this pref explicitly false are skipped. */
    prefKey: NotificationPrefKey;
};

type NotifyPayload = {
    /** Custom data delivered with the push (e.g. a deep-link target). */
    data?: Record<string, unknown>;
    /** Coalesce pushes sharing this id into one per device (e.g. a chat id). */
    collapseId?: string;
};

/** Either render localized copy from a template, or send a ready-made title/body. */
type NotifyContent =
    | { event: NotificationEvent; context: NotificationContext }
    | { title: string; body: string };

export type NotifyArgs = NotifyAudience & NotifyPayload & NotifyContent;

export async function notify(args: NotifyArgs): Promise<void> {
    const { groupId, userIds, excludeUserId, prefKey, data, collapseId } = args;

    try {
        await dbConnect();

        // Resolve the audience: group/user filters + per-user pref opt-out
        // (`$ne: false` keeps users whose pref is true or unset → default ON).
        const idFilter: Record<string, unknown> = {};
        if (userIds && userIds.length > 0) idFilter.$in = userIds;
        if (excludeUserId) idFilter.$ne = excludeUserId;

        const userQuery: Record<string, unknown> = {
            [`notificationPrefs.${prefKey}`]: { $ne: false },
        };
        if (groupId) userQuery.groups = { $in: [groupId] };
        if (Object.keys(idFilter).length > 0) userQuery._id = idFilter;

        const users = await User.find(userQuery, {
            notificationLanguage: 1,
            notificationStyle: 1,
        }).lean();
        if (users.length === 0) return;

        const prefsByUser = new Map<
            string,
            { language: NotificationLanguage; style: NotificationStyle }
        >();
        for (const u of users) {
            prefsByUser.set(String(u._id), {
                language: u.notificationLanguage ?? DEFAULT_NOTIFICATION_LANGUAGE,
                style: u.notificationStyle ?? DEFAULT_NOTIFICATION_STYLE,
            });
        }

        const tokens = await PushToken.find(
            { userId: { $in: users.map((u) => u._id) } },
            { token: 1, userId: 1 }
        ).lean();
        if (tokens.length === 0) return;

        // One message per valid token. Event mode localizes copy per the owner's
        // language/style; raw mode sends the same title/body to every device.
        const messages: ExpoPushMessage[] = [];
        const tokenByIndex: string[] = [];
        for (const { token, userId } of tokens) {
            if (!Expo.isExpoPushToken(token)) continue;

            let title: string;
            let body: string;
            if ("event" in args) {
                const prefs = prefsByUser.get(String(userId)) ?? {
                    language: DEFAULT_NOTIFICATION_LANGUAGE,
                    style: DEFAULT_NOTIFICATION_STYLE,
                };
                ({ title, body } = renderNotification(
                    args.event,
                    prefs.language,
                    prefs.style,
                    args.context
                ));
            } else {
                ({ title, body } = args);
            }

            messages.push({
                to: token,
                sound: "default",
                title,
                body,
                ...(data ? { data } : {}),
                ...(collapseId ? { collapseId } : {}),
            });
            tokenByIndex.push(token);
        }
        if (messages.length === 0) return;

        // Send in chunks. Reap tokens Expo reports as unregistered at the ticket
        // level. (DeviceNotRegistered more often surfaces in delivery *receipts* —
        // polling those via getPushNotificationReceiptsAsync is a deferred upgrade.)
        const deadTokens: string[] = [];
        const chunks = expo.chunkPushNotifications(messages);
        let offset = 0;
        for (const chunk of chunks) {
            try {
                const tickets = await expo.sendPushNotificationsAsync(chunk);
                tickets.forEach((ticket, i) => {
                    if (ticket.status === "error") {
                        const token = tokenByIndex[offset + i];
                        console.error(`Expo push error for ${token}:`, ticket.message);
                        if (ticket.details?.error === "DeviceNotRegistered") {
                            deadTokens.push(token);
                        }
                    }
                });
            } catch (err) {
                console.error("Expo push chunk failed", err);
            }
            offset += chunk.length;
        }

        if (deadTokens.length > 0) {
            await PushToken.deleteMany({ token: { $in: deadTokens } });
        }
    } catch (err) {
        console.error("notify() failed", err);
    }
}
