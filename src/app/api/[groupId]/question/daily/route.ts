import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse } from 'next/server'

//TODO questions left parameters
export const revalidate = 0

//return active daily questions
export async function GET(req: Request, { params }: { params: { groupId: string } }){
    try{
        await dbConnect();

        const { groupId } = params;

        const questions = await Question.find({
          groupId: groupId,
          category: "Daily",
          used: true,
          active: true,
        });
        if (!questions) {
            return NextResponse.json({ message: "No questions available" });
        }
        
        return NextResponse.json({ questions: questions });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ message: error });
    }
}