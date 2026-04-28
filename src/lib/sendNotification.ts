import dbConnect from "@/db/dbConnect";
import User from "@/db/models/User";
import admin from "firebase-admin";
import type { Types } from "mongoose";
import { env } from "@/env";
import {
    DEFAULT_NOTIFICATION_LANGUAGE,
    DEFAULT_NOTIFICATION_STYLE,
    type NotificationLanguage,
    type NotificationStyle,
} from "@/types/models/user";
import {
    renderNotification,
    type NotificationContext,
    type NotificationEvent,
} from "@/lib/notifications/templates";

if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.warn(
            "Failed to initialize Firebase Admin (this is expected in tests without valid FIREBASE_SERVICE_ACCOUNT)",
            error
        );
    }
}

export type SendNotificationArgs = {
    event: NotificationEvent;
    context: NotificationContext;
    groupId?: string | Types.ObjectId;
    userIds?: (string | Types.ObjectId)[];
};

export async function sendNotification({
    event,
    context,
    groupId = "",
    userIds,
}: SendNotificationArgs) {
    if (process.env.ENV === "dev") {
        console.warn("NOTIFICATION [dev]", event, context, groupId, userIds);
        return { success: true, successCount: 0, failureCount: 0 };
    }
    try {
        await dbConnect();

        const query: Record<string, unknown> = { fcmToken: { $exists: true, $ne: "" } };
        if (groupId !== "") {
            query.groups = { $in: [groupId] };
        }
        if (userIds && userIds.length > 0) {
            query._id = { $in: userIds };
        }

        const users = await User.find(query, {
            fcmToken: 1,
            notificationLanguage: 1,
            notificationStyle: 1,
        });

        if (users.length === 0) {
            console.warn("No tokens available to send messages");
            return;
        }

        // Bucket users by (language, style) so each bucket gets one multicast.
        const buckets = new Map<
            string,
            { language: NotificationLanguage; style: NotificationStyle; tokens: string[] }
        >();
        for (const user of users) {
            if (!user.fcmToken) continue;
            const language = user.notificationLanguage ?? DEFAULT_NOTIFICATION_LANGUAGE;
            const style = user.notificationStyle ?? DEFAULT_NOTIFICATION_STYLE;
            const key = `${language}|${style}`;
            let bucket = buckets.get(key);
            if (!bucket) {
                bucket = { language, style, tokens: [] };
                buckets.set(key, bucket);
            }
            bucket.tokens.push(user.fcmToken);
        }

        let totalSuccess = 0;
        let totalFailure = 0;

        for (const { language, style, tokens } of buckets.values()) {
            const { title, body } = renderNotification(event, language, style, context);
            const message = { data: { title, body }, tokens };
            const response = await admin.messaging().sendEachForMulticast(message);
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Error sending to token ${tokens[idx]}:`, resp.error);
                }
            });
            totalSuccess += response.successCount;
            totalFailure += response.failureCount;
        }

        return {
            success: true,
            successCount: totalSuccess,
            failureCount: totalFailure,
        };
    } catch (error) {
        console.error("Error sending messages:", error);
    }
}
