import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import FcmToken from "@/db/models/FcmToken";
import admin from "firebase-admin";

if (!admin.apps.length) {
    const serviceAccount = require("@/service_key.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
}

export async function GET(req: Request, res: NextResponse) {
  try {
    await dbConnect();
    const tokens = await FcmToken.find();

    const message = {
      notification: {
        title: "Your Title",
        body: "Your Notification Message",
      },
      tokens: tokens,
    };

    const response = await messaging.sendMulticast(message);
    console.log(response.successCount + " messages were sent successfully");

    return NextResponse.json("messages were sent successfully");
  } catch (error) {
    return NextResponse.json({ message: "Error sending messages", error });
  }
}
