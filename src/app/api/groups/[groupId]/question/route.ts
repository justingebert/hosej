import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import User from "@/db/models/user";
import { NextResponse, type NextRequest } from "next/server";
import Chat from "@/db/models/Chat";
import Group from "@/db/models/Group";

const POINTS = 3;

export const revalidate = 0;

// Function to handle question creation with populated options
export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    await dbConnect();

    const { groupId } = params;
    
    const data = await req.json();
    const { category, questionType, question, submittedBy, image } = data;
    if (!groupId || !category || !questionType || !question || !submittedBy) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Populate options based on question type
    let options = data.options || [];
    if (questionType.startsWith("users-")) {
      const users = await User.find({ "groups.group": groupId });
      options = users.map((user) => user.username);
    } else if (questionType.startsWith("rating")) {
      options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    }

    const newQuestion = new Question({
      groupId: groupId,
      category: category,
      questionType: questionType,
      question: question,
      image: image,
      options: options,
      submittedBy: submittedBy,
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
    
    //TODO pass from context
    const group = await Group.findById(groupId);
    const submittingUser = await User.findById(submittedBy);
    await group.addPoints(submittingUser._id, POINTS);
   
    return NextResponse.json({ newQuestion },{ status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json({ message: "Internal server error" },{ status: 500 });
  }
}
