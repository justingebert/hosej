import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Question from '@/db/models/Question';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Group from '@/db/models/Group';

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { groupId: string, questionId: string } }) {
    try {
        await dbConnect();

        const { groupId, questionId } = params;

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
        const results = Object.entries(voteCounts).map(([option, votes]: [string, any]) => {
            const percentage = Math.round((votes / totalVotes) * 100);
            return { option, votes, percentage };
        });

        results.sort((a, b) => b.votes - a.votes);

        // If the question type starts with "image", generate pre-signed URLs for options
        if (question.questionType.startsWith("image")) {
            const resultsWithImages = await Promise.all(
                results.map(async (result) => {
                    const optionUrl = new URL(result.option);
                    let s3Key = optionUrl.pathname;
                    if (s3Key.startsWith('/')) {
                        s3Key = s3Key.substring(1); // Remove leading '/'
                    }

                    const command = new GetObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: s3Key,
                        ResponseCacheControl: 'max-age=86400, public',
                    });

                    try {
                        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 180 }); // Short-lived URL
                        return { ...result, option: signedUrl }; // Replace the option with the signed URL
                    } catch (s3Error: any) {
                        console.error(`Failed to generate pre-signed URL for option ${result.option}`, s3Error);
                        throw new Error(`Failed to generate pre-signed URL for option: ${s3Error.message}`);
                    }
                })
            );

            return NextResponse.json({ results: resultsWithImages, totalVotes, totalUsers });
        }

        // Return the results
        return NextResponse.json({ results, totalVotes, totalUsers });
    } catch (error) {
        console.error('Error fetching question results:', error);
        return NextResponse.json({ message: 'Error fetching question results' }, { status: 500 });
    }
}
