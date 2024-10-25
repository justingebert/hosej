import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse } from 'next/server'
import User from "@/db/models/user";
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/groupAuth";

const POINTS = 1;

export const revalidate = 0

//vote on a question
export async function POST(req: Request, { params }: { params: { groupId: string, questionId: string } }) {
  const { groupId, questionId } = params;
  const userId = req.headers.get('x-user-id') as string;
  try {
    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }
    const data = await req.json();
    const { response } = data;

    await dbConnect();

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }
    const user = await User.findById(userId);

    const hasVoted = question.answers.some((answer: any) =>
      answer.user.equals(user._id)
    );
    if (hasVoted) {
      return NextResponse.json({ message: "You have already voted" }, { status: 304 });
    }

    await Question.findByIdAndUpdate(
      questionId,
      { $push: { answers: { user: user._id, response: response, time: Date.now() } } },
      { new: true, runValidators: true }
    );

    const group = await Group.findById(groupId)
    await group.addPoints(user._id, POINTS);

    return NextResponse.json({ message: "Vote submitted" }, { status: 200 });
  } catch (error) {
    console.log(`Error voting for ${questionId}`,error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}