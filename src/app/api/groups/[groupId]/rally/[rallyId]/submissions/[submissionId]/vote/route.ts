import dbConnect from "@/lib/dbConnect";
import Rally from "@/db/models/rally";
import { NextRequest, NextResponse } from 'next/server'
import User from "@/db/models/user";
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/groupAuth";

const POINTS = 1;

//vote on a submission
export async function POST(req: NextRequest, { params }: { params: { groupId: string, rallyId:string, submissionId:string } }){
    const { groupId, rallyId, submissionId } = params;
    const userId = req.headers.get('x-user-id') as string;
    
    try{
        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
          return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
        }
        await dbConnect();
        
        const user = await User.findById(userId);
        const group = await Group.findById(groupId)

        const rally = await Rally.findOne({groupId: groupId, _id: rallyId});
        if (!rally) {
            return NextResponse.json({ message: 'Rally not found' }, { status: 404 });
        }
        const submission = rally.submissions.id(submissionId);
        if (!submission) {
            return NextResponse.json({ message: 'Submission not found' });
        }
        const userVoted = submission.votes.find((vote:{user:string}) => vote.user === user._id);
        if (userVoted) {
            return NextResponse.json({ message: 'User already voted' }, {status: 304});
        }
        submission.votes.push({ user: user._id, time: Date.now() });
        
        await rally.save();

        await group.addPoints(user._id, POINTS);
       
        return NextResponse.json("Vote added successfully")
    }catch (error) {
        console.error(error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}