import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse } from 'next/server'
import User from "@/db/models/user";

const POINTS = 1;

export const revalidate = 0

//vote on a question
export async function POST(req: Request, { params }: { params: { groupId: string, questionId: string } }) {
  try {
    const data = await req.json();
    const { response, userThatVoted } = data;
    const { groupId, questionId } = params;

    await dbConnect();

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json({ message: "Question not found" });
    }

    const user = await User.findById(userThatVoted);
    const hasVoted = question.answers.some((answer: any) =>
      answer.user.equals(user._id)
    );
    if (hasVoted) {
      return NextResponse.json({ message: "You have already voted" });
    }

    await Question.findByIdAndUpdate(
      questionId,
      { $push: { answers: { user: user._id, response: response, time: Date.now() } } },
      { new: true, runValidators: true }
    );

    await user.addPoints(groupId, POINTS);

    return NextResponse.json({ message: "Vote submitted" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error });
  }
}