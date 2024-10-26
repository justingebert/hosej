import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Question from '@/db/models/Question';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Group from '@/db/models/Group';
import { isUserInGroup } from '@/lib/groupAuth';
import { generateSignedUrl } from '@/lib/question/questionOptions';

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { groupId: string, questionId: string } }) {
    const { groupId, questionId } = params;
    const userId = req.headers.get('x-user-id') as string;

    try {
        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
          return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
        }
        await dbConnect();

        const question = await Question.findOne({ groupId, _id: questionId });
        if (!question) {
            return NextResponse.json({ message: "Question not found" }, { status: 404 });
        }

        const voteCounts = question.answers.reduce((acc: any, answer: any) => {
            acc[answer.response] = (acc[answer.response] || 0) + 1;
            return acc;
        }, {});

        const group =  await Group.findById(groupId)
        const totalUsers = group.members.length;
        const totalVotes = question.answers.length;

        // Calculate the results with percentages
        const results = Object.entries(voteCounts).map(([option, votes]: [any, any]) => {
            const percentage = Math.round((votes / totalVotes) * 100);
            return { option, votes, percentage };
        });

        results.sort((a, b) => b.votes - a.votes);

        // If the question type starts with "image", generate pre-signed URLs for options
        if (question.questionType.startsWith("image")) {
            const resultsWithImages = await Promise.all(
                results.map(async (result) => {
                    const { url } = await generateSignedUrl(result.option);
                    return { ...result, option: url };
                })
            );

            return NextResponse.json({ results: resultsWithImages, totalVotes, totalUsers });
        }

        return NextResponse.json({ results, totalVotes, totalUsers }, { status: 200 });
    } catch (error) {
        console.error('Error fetching question results:', questionId,  error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
