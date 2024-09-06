import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import { NextRequest, NextResponse } from 'next/server'
import User from "@/db/models/user";

const POINTS = 1;

//vote on a submission
export async function POST(req: NextRequest, { params }: { params: { groupId: string } }){
    try{
        await dbConnect();
        const { groupId } = params;
        const { rallyId, submissionId, userThatVoted } = await req.json()
        console.log(rallyId, submissionId, userThatVoted)


        const rally = await Rally.findOne({groupId: groupId, _id: rallyId});
        if (!rally) {
            return NextResponse.json({ message: 'Rally not found' });
        }
        const submission = rally.submissions.id(submissionId);
        if (!submission) {
            return NextResponse.json({ message: 'Submission not found' });
        }
        const user = submission.votes.find((vote:{username:string}) => vote.username === userThatVoted);
        if (user) {
            return NextResponse.json({ message: 'User already voted' });
        }
        submission.votes.push({ username: userThatVoted, time: Date.now() });
        
        await rally.save();
        const votingUser = await User.findOne({ username: userThatVoted });
        await votingUser.addPoints(POINTS);
       
        return NextResponse.json("Vote added successfully")
    }catch (error) {
        console.error(error)
        return NextResponse.json({ message: error });
    }
}