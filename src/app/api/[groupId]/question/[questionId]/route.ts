import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse, type NextRequest } from 'next/server'

export const revalidate = 0

//get question by id
export async function GET(req: NextRequest,  { params }: { params: { groupId: string, questionId: string } }){
    try{
        await dbConnect();
        const {questionId, groupId} = params
        
        const question = await Question.findOne({groupId: groupId, _id: questionId});

        return NextResponse.json(question);
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ message: error });
    }
}