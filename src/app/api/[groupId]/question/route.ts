import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import User from "@/db/models/user";
import { NextResponse, type NextRequest } from 'next/server';
import { migrateQuestions } from "@/db/migrations/migrateQuestions";

const POINTS = 3;

export const revalidate = 0;

// Function to handle question creation with populated options
export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        // Check if required fields are present
        const { groupId, category, questionType, question, submittedBy } = data;
        if (!groupId || !category || !questionType || !question || !submittedBy) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        // Populate options based on question type
        let options = data.options || [];
        if (questionType.startsWith("users-")) {
            const users = await User.find({ groups: groupId });
            options = users.map(user => user.username);
        } else if (questionType.startsWith("rating")) {
            options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        }

        // Create the question
        const newQuestion = new Question({
            groupId,
            category,
            questionType,
            question,
            options,
            submittedBy,
        });

        await newQuestion.save();

        // Add points to the submitting user
        const submittingUser = await User.findOne({ username: submittedBy });
        if (submittingUser) {
            await submittingUser.addPoints(POINTS);
        } else {
            return NextResponse.json({ message: "Submitting user not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Created Question", question: newQuestion }, { status: 201 });
    } catch (error) {
        console.error("Error creating question:", error);
        return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
    }
}

export async function PUT() {
    try {
        const result = await migrateQuestions();
        return NextResponse.json({ success: true, message: result });
    } catch (error) {
        console.error("Error migrating questions:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}