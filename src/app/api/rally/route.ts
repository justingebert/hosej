import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import { NextResponse } from "next/server";

export const revalidate = 0;

//get current rally and set state
export async function GET(req: Request) {
  try {
    await dbConnect();
    const currentTime = new Date();

    const rally = await Rally.findOne({ active: true});
    if (!rally) {
      return NextResponse.json({ message: "No active rally", rally: null });
    }

   if (currentTime >= new Date(rally.endTime) && !rally.votingOpen) {
      rally.votingOpen = true;
      rally.endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // Set end time for voting period
      await rally.save();
    }

    //this makes no sense 
    if (rally.votingOpen && currentTime >= new Date(rally.endTime)) {
      rally.endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // Set end time for results period
      await rally.save();
    }

    if (rally.votingOpen && currentTime >= new Date(rally.endTime)) {
      rally.active = false;
      rally.used = true;
      await rally.save();

      // Start a new rally
      const newRally = await Rally.findOne({ active: false, used: false });
      if (newRally) {
        newRally.active = true;
        newRally.startTime = currentTime;
        newRally.endTime = new Date(currentTime.getTime() + newRally.lengthInDays * 24 * 60 * 60 * 1000); // Set end time based on lengthInDays
        await newRally.save();
      }
    }

    return NextResponse.json({ rally });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error });
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

    return NextResponse.json({ message: "Rally created successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
