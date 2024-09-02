import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from 'next/server';

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

export const revalidate = 0;

// Return active daily questions
export async function GET(req: Request, { params }: { params: { groupId: string } }) {
    try {
        await dbConnect();

        const { groupId } = params;

        const questions = await Question.find({
            groupId: groupId,
            category: "Daily",
            used: true,
            active: true,
        });

        if (!questions) {
            return NextResponse.json({ message: "No questions available" });
        }

        // Map over questions and conditionally add pre-signed image URLs if an image is present
        const questionsWithImages = await Promise.all(
            questions.map(async (question) => {
                if (question.imageUrl) {
                    const urlObject = new URL(question.imageUrl);
                    let s3Key = urlObject.pathname;
                    if (s3Key.startsWith('/')) {
                        s3Key = s3Key.substring(2); // Remove leading '//'
                    }

                    const command = new GetObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: s3Key,
                        ResponseCacheControl: 'max-age=86400, public',
                    });

                    try {
                        const url = await getSignedUrl(s3, command, { expiresIn: 60 }); // Short-lived URL
                        return {
                            ...question.toObject(),
                            imageUrl: url,
                        };
                    } catch (s3Error: any) {
                        console.error(`Failed to generate pre-signed URL for ${question.imageUrl}`, s3Error);
                        throw new Error(`Failed to generate pre-signed URL: ${s3Error.message}`);
                    }
                } else {
                    return question.toObject(); // Return the question without modification if no image
                }
            })
        );

        return NextResponse.json({ questions: questionsWithImages });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: error });
    }
}
