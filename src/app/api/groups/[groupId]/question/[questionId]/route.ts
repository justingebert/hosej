import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse, type NextRequest } from 'next/server'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

//export const revalidate = 0

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});


//get question by id
export async function GET(req: NextRequest,  { params }: { params: { groupId: string, questionId: string } }){
    const {questionId, groupId} = params
    try{
        await dbConnect();
        
        let question = await Question.findOne({groupId: groupId, _id: questionId});

        if (question.image) {
            const urlObject = new URL(question.image);
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
                question = {
                    ...question.toObject(),
                    imageUrl: url,
                };
            } catch (s3Error: any) {
                console.error(`Failed to generate pre-signed URL for ${question.imageUrl}`, s3Error);
                throw new Error(`Failed to generate pre-signed URL: ${s3Error.message}`);
            }
        }
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

            question.options = optionUrls; // Replace options with signed URLs
        }

        return NextResponse.json(question);
    }
    catch (error) {
        console.log("Error getting question: ", questionId, error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}