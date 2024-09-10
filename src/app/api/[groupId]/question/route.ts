import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import User from "@/db/models/user";
import { NextResponse, type NextRequest } from "next/server";
import { migrateQuestions } from "@/db/migrations/migrateQuestions";
import Chat from "@/db/models/Chat";
import { CopyObjectOutputFilterSensitiveLog } from "@aws-sdk/client-s3";

const POINTS = 3;

export const revalidate = 0;

// Function to handle question creation with populated options
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const { groupId, category, questionType, question, submittedBy, image } = data;
    if (!groupId || !category || !questionType || !question || !submittedBy) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Populate options based on question type
    let options = data.options || [];
    if (questionType.startsWith("users-")) {
      const users = await User.find({ groups: groupId });
      options = users.map((user) => user.username);
    } else if (questionType.startsWith("rating")) {
      options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    }

    const newQuestion = new Question({
      groupId,
      category,
      questionType,
      question,
      image,
      options,
      submittedBy,
    });

    await newQuestion.save();

    const newChat = new Chat({
      group: groupId,
      entity: newQuestion._id,
      entityModel: "Question", 
      messages: [], 
    });

    await newChat.save();
    newQuestion.chat = newChat._id;
    await newQuestion.save();


    const submittingUser = await User.findOne({ username: submittedBy });
    if (submittingUser) {
      await submittingUser.addPoints(POINTS);
    } else {
      return NextResponse.json(
        { message: "Submitting user not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { newQuestion },
      { status: 201 }
    );
  } catch (error:any) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
