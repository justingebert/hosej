import dbConnect from "@/db/dbConnect";
import Rally from "@/db/models/rally";
import { NextResponse } from "next/server";
import user from "@/db/models/user";

//TODO questions left parameters
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    await dbConnect();
    const rally = await Rally.findOne({ active: true });
    if (!rally) {
      return NextResponse.json({ message: "No active rally", rally: null });
    }

    const currentTime = new Date();
    if (currentTime >= new Date(rally.endTime) && !rally.votingOpen) {
      rally.votingOpen = true;
      rally.resultsShowing = false;
      await rally.save();
    }

    const totalUsers = await user.countDocuments({});
    const totalVotes = rally.submissions.reduce(
      (acc: any, submission: any) => acc + submission.votes.length,
      0
    );
    const allUsersVoted = totalVotes >= totalUsers;

    if (allUsersVoted) {
      rally.votingOpen = false;
      rally.resultsShowing = true;
      rally.used = true;
      await rally.save();
    }

    return NextResponse.json({ rally });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error });
  }
}

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
