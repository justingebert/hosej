import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse } from 'next/server'
import user from "@/db/models/user";

const POINTS = 1;

export const revalidate = 0

//vote on a question
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { questionId, response, userThatVoted } = data;

    await dbConnect();

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json({ message: "Question not found" });
    }

    const votingUser = await user.findOne({ username: userThatVoted });
    const hasVoted = question.answers.some((answer: any) =>
      answer.username.equals(votingUser._id)
    );
    if (hasVoted) {
      return NextResponse.json({ message: "You have already voted" });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      { $push: { answers: { username: votingUser._id, response: response, time: Date.now() } } },
      { new: true, runValidators: true }
    );

    await votingUser.addPoints(POINTS);

    return NextResponse.json({ message: "Vote submitted" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error });
  }
}