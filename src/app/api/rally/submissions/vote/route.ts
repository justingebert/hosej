import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import { NextResponse } from 'next/server'

const POINTS = 1;

//vote on a submission
export async function POST(req: Request){
    try{
        await dbConnect();
        const { rallyId, submissionId, userThatVoted } = await req.json()

        const rally = await Rally.findById(rallyId);
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

        const votingUser = await user.findOne({ username: userThatVoted });
        votingUser.points.push(votingUser.points[votingUser.points.length - 1] + POINTS);
        votingUser.save();
       
        return NextResponse.json("Vote added successfully")
    }catch (error) {
        console.error(error)
        return NextResponse.json({ message: error });
    }
}