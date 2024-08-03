import dbConnect from "@/lib/dbConnect";
import FcmToken from "@/db/models/FcmToken";
import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function sendNotification(title: string, body: string) {
  try {
    await dbConnect();
    const tokenDocs = await FcmToken.find();

    const tokens = tokenDocs.map(doc => doc.token);

    if (tokens.length === 0) {
      throw new Error('No tokens available to send messages');
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

    console.log(`${response.successCount} messages were sent successfully`);
    console.log(`${response.failureCount} messages failed`);

    return { success: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    console.error("Error sending messages:", error);
    throw new Error("Error sending messages");
  }
}
