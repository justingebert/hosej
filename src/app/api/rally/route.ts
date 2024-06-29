import dbConnect from "@/db/dbConnect";
import Rally from "@/db/models/rally";
import { NextResponse } from 'next/server'
import user from "@/db/models/user";

//TODO questions left parameters
export const revalidate = 0

export async function GET(req: Request){
    await dbConnect();
    try{
        const rally = await Rally.findOne({ active: true });
        if (!rally) {
            return NextResponse.json({ message: "No active rally" , rally: null});
        }

        const currentTime = new Date();
        if (currentTime >= new Date(rally.endTime) && !rally.votingOpen) {
            rally.votingOpen = true;
            await rally.save();
        }

        const totalUsers = await user.countDocuments({});
        const totalVotes = rally.submissions.reduce((acc, submission) => acc + submission.votes.length, 0);
        const allUsersVoted = totalVotes >= totalUsers;

        if (allUsersVoted) {
            rally.votingOpen = false;
            rally.resultsShowing = true;
            await rally.save();
          }

        return NextResponse.json({rally});
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ message: error });
    }
}