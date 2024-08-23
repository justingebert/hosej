import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Question from '@/db/models/Question';
import User from '@/db/models/user';

export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { groupId: string, questionId: string } }) {
  try {
    await dbConnect();

    const { groupId, questionId } = params;

    // Find the question by ID
    const question = await Question.findOne({ groupId, _id: questionId });
    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    // Calculate the vote counts
    const voteCounts = question.answers.reduce((acc: any, answer: any) => {
      acc[answer.response] = (acc[answer.response] || 0) + 1;
      return acc;
    }, {});

    // Get the total number of users
    const totalUsers = await User.countDocuments();
    const totalVotes = question.answers.length;

    // Calculate the results with percentages
    const results = Object.entries(voteCounts).map(([option, votes]: [string, any]) => {
      const percentage = Math.round((votes / totalVotes) * 100);
      return { option, votes, percentage };
    });

    results.sort((a, b) => b.votes - a.votes);

    // Return the results
    return NextResponse.json({ results, totalVotes, totalUsers });
  } catch (error) {
    console.error('Error fetching question results:', error);
    return NextResponse.json({ message: 'Error fetching question results' }, { status: 500 });
  }
}
