import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from 'next/server';
import { isUserInGroup } from "@/lib/groupAuth";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

export const revalidate = 60;

// Return active daily questions
export async function GET(req: Request, { params }: { params: { groupId: string } }) {
    const { groupId } = params;
    const userId = req.headers.get('x-user-id') as string;
    
    try {
        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
          return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
        }
        await dbConnect();

        const questions = await Question.find({
            groupId: groupId,
            category: "Daily",
            used: true,
            active: true,
        });

        if (!questions || questions.length === 0) {
            return NextResponse.json({ questions: [], message: "No questions available" });
        }

        // Map over questions and conditionally add pre-signed image URLs if an image is present
        const questionsWithImages = await Promise.all(
            questions.map(async (question) => {
                let questionWithImage = question.toObject();

                // Handle main question image
                if (question.image) {
                    const urlObject = new URL(question.image);
                    let s3Key = urlObject.pathname;
                    if (s3Key.startsWith('/')) {
                        s3Key = s3Key.substring(2); // Remove leading '/'
                    }

                    const command = new GetObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: s3Key,
                        ResponseCacheControl: 'max-age=86400, public',
                    });

                    try {
                        const url = await getSignedUrl(s3, command, { expiresIn: 180 }); // Short-lived URL
                        questionWithImage.imageUrl = url;
                    } catch (s3Error: any) {
                        console.error(`Failed to generate pre-signed URL for ${question.image}`, s3Error);
                        throw new Error(`Failed to generate pre-signed URL: ${s3Error.message}`);
                    }
                }

                // Handle question options if they are images
                if (question.questionType.startsWith("image")) {
                    const optionUrls = await Promise.all(
                        question.options.map(async (option: string) => {
                            if (option === "") throw new Error("Option is empty");

                            const urlObject = new URL(option);
                            let s3Key = urlObject.pathname;
                            if (s3Key.startsWith('/')) {
                                s3Key = s3Key.substring(2); // Remove leading '/'
                            }

                            const command = new GetObjectCommand({
                                Bucket: process.env.AWS_BUCKET_NAME,
                                Key: s3Key,
                                ResponseCacheControl: 'max-age=86400, public',
                            });

                            try {
                                const url = await getSignedUrl(s3, command, { expiresIn: 60 }); // Short-lived URL
                                return url;
                            } catch (s3Error: any) {
                                console.error(`Failed to generate pre-signed URL for option ${option}`, s3Error);
                                throw new Error(`Failed to generate pre-signed URL for option: ${s3Error.message}`);
                            }
                        })
                    );

                    questionWithImage.options = optionUrls; // Replace options with signed URLs
                }

                return questionWithImage;
            })
        );

        return NextResponse.json({ questions: questionsWithImages });
    } catch (error:any) {
        console.error(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
