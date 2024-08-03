import dbConnect from "@/lib/dbConnect";
import FcmToken from "@/db/models/FcmToken";
import admin from "firebase-admin";
import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  const { title, body } = await req.json();

  try {
    const result = await sendNotification(title, body);
    return NextResponse.json({ message: `${result.successCount} messages were sent successfully` });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}