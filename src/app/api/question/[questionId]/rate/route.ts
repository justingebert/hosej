import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse, type NextRequest } from 'next/server';

export const revalidate = 0;

// Handle rating update
export async function POST(req: NextRequest, { params }: { params: { questionId: string } }) {
    const { questionId } = params;

    const body = await req.json();
    const { rating, username } = body;
    console.log("Received data:", { rating, username, questionId });

    try {
        await dbConnect();

        const question = await Question.findById(questionId);

        if (!question) {
            return NextResponse.json({ message: "Question not found" }, { status: 404 });
        }

        // Ensure the rating object is initialized
        if (!question.rating) {
            question.rating = {
                good: { count: 0, usernames: [] },
                ok: { count: 0, usernames: [] },
                bad: { count: 0, usernames: [] }
            };
        }

        // Update the appropriate rating
        console.log(question)
        if (rating === "good") {
            console.log("Updating good rating...");
            console.log(question.rating.good.usernames)
            if (!question.rating.good.usernames.includes(username)) {
                question.rating.good.count += 1;
                question.rating.good.usernames.push(username);
                question.markModified('rating'); // Mark the rating object as modified
            } else {
                console.log("Username already exists in good rating");
            }
        } else if (rating === "ok") {
            console.log("Updating ok rating...");
            if (!question.rating.ok.usernames.includes(username)) {
                question.rating.ok.count += 1;
                question.rating.ok.usernames.push(username);
                question.markModified('rating'); // Mark the rating object as modified
            } else {
                console.log("Username already exists in ok rating");
            }
        } else if (rating === "bad") {
            console.log("Updating bad rating...");
            if (!question.rating.bad.usernames.includes(username)) {
                question.rating.bad.count += 1;
                question.rating.bad.usernames.push(username);
                question.markModified('rating'); // Mark the rating object as modified
            } else {
                console.log("Username already exists in bad rating");
            }
        }
        
        await question.save();
        

        console.log("Updated question:", question);

        return NextResponse.json({ message: "Rating added" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
