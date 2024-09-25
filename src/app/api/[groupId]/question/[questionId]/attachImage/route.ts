import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Question from '@/db/models/Question';

export async function POST(req: NextRequest, { params }: { params: { groupId: string, questionId: string } }) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ message: "Image URL is required" }, { status: 400 });
    }

    await dbConnect();
    const { groupId, questionId } = params;

    const question = await Question.findOne({ groupId, _id: questionId });
    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    question.image = imageUrl;
    await question.save();

    return NextResponse.json({ message: 'Image attached successfully' });
  } catch (error) {
    console.error('Error fetching question results:', error);
    return NextResponse.json({ message: 'Error fetching question results' }, { status: 500 });
  }
}
