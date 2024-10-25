import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse, type NextRequest } from 'next/server';
import { isUserInGroup } from "@/lib/groupAuth";

export const revalidate = 0;

// Handle rating update
export async function POST(req: NextRequest, { params }: { params: { groupId:string, questionId: string } }) {
    const { groupId, questionId } = params;
    const userId = req.headers.get('x-user-id') as string;

    try {
        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
          return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
        }

        const data = await req.json();
        const { rating } = data;

        await dbConnect();

        const user = userId;
        const question = await Question.findById(questionId);
        if (!question) {
            return NextResponse.json({ message: "Question not found" }, { status: 404 });
        }

        if (question.rating.good.includes(user) || question.rating.ok.includes(user) || question.rating.bad.includes(user)) {
            return NextResponse.json({ message: "User already rated" }, { status: 304 });
        }
        
        if (rating === "good") {
            question.rating.good.push(user);
        } else if (rating === "ok") {
                question.rating.ok.push(user);
        } else if (rating === "bad") {
                question.rating.bad.push(user);
        }
        await question.save();
    
        return NextResponse.json({ message: "Rating added" });
    } catch (error:any) {
        console.error(`Error rating question: ${questionId}`,error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
