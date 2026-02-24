import dbConnect from "@/db/dbConnect";
import User from "@/db/models/User";
import admin from "firebase-admin";
import type { Types } from "mongoose";
import { env } from "@/env";

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export async function sendNotification(
    title: string,
    body: string,
    groupId: string | Types.ObjectId = ""
) {
    if (process.env.ENV === "dev") {
        console.warn("NOTIFICATION [dev]", title, body, groupId);
        return { success: true, successCount: 0, failureCount: 0 };
    }
    try {
        await dbConnect();

        let users;
        if (groupId === "") {
            users = await User.find({ fcmToken: { $exists: true, $ne: "" } });
        } else {
            users = await User.find({
                fcmToken: { $exists: true, $ne: "" },
                groups: { $in: [groupId] },
            });
        }
        // Aggregate all tokens
        const tokens = users.map((user) => user.fcmToken).filter((token) => token !== undefined);

        if (tokens.length === 0) {
            console.warn("No tokens available to send messages");
            return;
        }

        const message = {
            data: {
                title: title,
                body: body,
            },
            tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                console.error(`Error sending to token ${tokens[idx]}:`, resp.error);
            }
        });

        console.warn(`${response.successCount} messages were sent successfully`);
        console.warn(`${response.failureCount} messages failed`);

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
        };
    } catch (error) {
        console.error("Error sending messages:", error);
        throw new Error("Error sending messages");
    }
}
