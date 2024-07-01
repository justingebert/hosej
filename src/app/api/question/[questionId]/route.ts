import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse, type NextRequest } from 'next/server'

export const revalidate = 0

//get question by id
export async function GET(req: NextRequest,  { params }: { params: { questionId: string } }){
    const questionId = params.questionId;
    try{
        await dbConnect();
        
        console.log(questionId);
        const question = await Question.findById(questionId)

        return NextResponse.json({question: question});
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ message: error });
    }
}