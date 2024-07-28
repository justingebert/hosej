import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import FcmToken from "@/db/models/FcmToken";
import admin from "firebase-admin";

const dynamic = 'force-dynamic'

if (!admin.apps.length) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
}

export async function POST(req: Request, res: NextResponse) {

  const {title, body}  = await req.json();

  try {
    await dbConnect();
    const tokenDocs = await FcmToken.find();
    
    // Extract token values
    const tokens = tokenDocs.map(doc => doc.token);

    if (tokens.length === 0) {
      return NextResponse.json({ message: 'No tokens available to send messages' }, { status: 400 });
    }
    
    //TODO add andriod/apple specific incons?
    const message = {
      notification: {
        title: title,
        body: body,
        image: "./AppIcons/apple-touch-icon.png",
      },
      android: {
        notification: {
          icon: './AppIcons/apple-touch-icon.png',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: dynamic,
            "interruption-level": "time-sensitive",
            alert: {
              title: title,
              body: body,
          },
        },
      },
    },

      tokens: tokens,
  };

    console.log("Sending notification...");
    const response = await admin.messaging().sendEachForMulticast(message);
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        console.error(`Error sending to token ${tokens[idx]}:`, resp.error);
      }
    });
    //TODO failure
    console.log(`${response.successCount} messages were sent successfully`);
    console.log(`${response.failureCount} messages failed`);

    return NextResponse.json({ message: `${response.successCount} messages were sent successfully` });
  } catch (error) {
    console.error("Error sending messages:", error);
    return NextResponse.json({ message: "Error sending messages", error });
  }
}
