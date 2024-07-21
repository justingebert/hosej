import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse, type NextRequest } from 'next/server'
import user from "@/db/models/user";

const POINTS = 3;

export const revalidate = 0

//TODO improve error handeling
//create a question
export async function POST(req: NextRequest){  
    try{
        const data = await req.json();

        await dbConnect();

        const question = new Question({category: data.category, questionType: data.questionType, question:data.question, options: data.options, submittedBy: data.submittedBy });
        await question.save();
        if(!question){
            return NextResponse.json({ message: "No question found" });
        }

        const submittingUser = await user.findOne({ username: data.submittedBy });
        await submittingUser.addPoints(POINTS);

        return Response.json({ message: "Created Question"});
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({ message: error });
    }
}