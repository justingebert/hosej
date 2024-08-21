import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse, type NextRequest } from 'next/server';

export const revalidate = 0;

// Handle rating update
export async function POST(req: NextRequest, { params }: { params: { questionId: string } }) {
    const { questionId } = params;
    const body = await req.json();
    const { rating, username } = body;

    try {
        await dbConnect();

        const question = await Question.findById(questionId);
        if (!question) {
            return NextResponse.json({ message: "Question not found" }, { status: 404 });
        }

        if (question.rating.good.usernames.includes(username) || question.rating.ok.usernames.includes(username) || question.rating.bad.usernames.includes(username)) {
            return NextResponse.json({ message: "User already rated" });
        }
        
        if (rating === "good") {
                question.rating.good.count += 1;
                question.rating.good.usernames.push(username);
        } else if (rating === "ok") {
                question.rating.ok.count += 1;
                question.rating.ok.usernames.push(username);
        } else if (rating === "bad") {
                question.rating.bad.count += 1;
                question.rating.bad.usernames.push(username);
        }
        await question.save();
    
        return NextResponse.json({ message: "Rating added" });
    } catch (error:any) {
        console.error(error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
