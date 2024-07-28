import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import { NextResponse } from "next/server";
import user from "@/db/models/user";

const MAX_RALLIES = 2;
const POINTS = 3;

export const revalidate = 0;

//get current rally and set state
export async function GET(req: Request) {
  try {
    await dbConnect();
    const currentTime = new Date();

    // Find all active rallies
    const rallies = await Rally.find({ active: true }).limit(MAX_RALLIES);

    if (rallies.length === 0) {
      return NextResponse.json({ message: "No active rallies", rallies: [] });
    }

    for (let rally of rallies) {
      if (currentTime >= new Date(rally.endTime) && !rally.votingOpen) {
        rally.votingOpen = true;
        rally.endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // Set end time for voting period
        await rally.save();

        const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: '🚨HoseJ Rally !!🚨', body: '🚨JETZT VOTEN DU FISCH🚨' }),
          cache: 'no-cache'
        });
      
        if (!notificationResponse.ok) {
          throw new Error('Failed to send notification');
        }
      }

      if (rally.votingOpen && currentTime >= new Date(rally.endTime)) {
        rally.active = false;
        rally.used = true;
        rally.votingOpen = false;
        await rally.save();

        // Start a new rally
        const newRally = await Rally.findOne({ active: false, used: false });
        if (newRally) {
          newRally.active = true;
          newRally.startTime = currentTime;
          newRally.endTime = new Date(currentTime.getTime() + newRally.lengthInDays * 24 * 60 * 60 * 1000); // Set end time based on lengthInDays
          await newRally.save();

          const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: '🚨HoseJ Rally!!🚨', body: '🚨NEUE RALLY HAT BEGONNEN DU FISCH🚨' }),
            cache: 'no-cache'
          });
        
          if (!notificationResponse.ok) {
            throw new Error('Failed to send notification');
          }
        }
      }
    }

    return NextResponse.json({ rallies });
  } catch (error:any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

//create rally
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { task, lengthInDays, submittedBy } = await req.json();

    //TODO this is different - garbage 
    const newRally = new Rally({
      task,
      lengthInDays,
      submittedBy,
    });

    await newRally.save();

    const submittingUser = await user.findOne({ username: submittedBy });
    await submittingUser.addPoints(POINTS);

    return NextResponse.json({ message: "Rally created successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
