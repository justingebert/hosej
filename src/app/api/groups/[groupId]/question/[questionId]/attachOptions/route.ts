import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Question from '@/db/models/Question';

export async function POST(req: NextRequest, { params }: { params: { groupId: string, questionId: string } }) {
  try {
    const { options } = await req.json();
    if (!options) {
      return NextResponse.json({ message: "Options are required" }, { status: 400 });
    }

    await dbConnect();
    const { groupId, questionId } = params;

    const question = await Question.findOne({ groupId, _id: questionId });
    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    question.options = options;
    await question.save();

    return NextResponse.json({ message: 'Image attached successfully' });
  } catch (error) {
    console.error('Error fetching question results:', error);
    return NextResponse.json({ message: 'Error fetching question results' }, { status: 500 });
  }
}
