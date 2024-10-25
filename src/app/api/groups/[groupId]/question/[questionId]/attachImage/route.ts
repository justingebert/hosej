import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Question from '@/db/models/Question';
import { isUserInGroup } from '@/lib/groupAuth';

export async function POST(req: NextRequest, { params }: { params: { groupId: string, questionId: string } }) {
  const { groupId, questionId } = params;
  const userId = req.headers.get('x-user-id') as string;
  
  try {
    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ message: "Image URL is required" }, { status: 400 });
    }
    await dbConnect();
    const question = await Question.findOne({ groupId, _id: questionId });
    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    question.image = imageUrl;
    await question.save();

    return NextResponse.json({ message: 'Image attached successfully' });
  } catch (error) {
    console.error('Error attaching image to question: ',questionId,  error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
