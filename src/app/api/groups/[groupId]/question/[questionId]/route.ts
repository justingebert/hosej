import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse, type NextRequest } from 'next/server'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isUserInGroup } from "@/lib/groupAuth";
import { generateSignedUrl } from "@/lib/question/questionOptions";

//export const revalidate = 0

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});


//get question by id
export async function GET(req: NextRequest,  { params }: { params: { groupId: string, questionId: string } }){
    const {questionId, groupId} = params
    const userId = req.headers.get('x-user-id') as string;
    
    try{
        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
          return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
        }
        await dbConnect();
        
        let question = await Question.findOne({groupId: groupId, _id: questionId});

        if (question.image) {
            const { url } = await generateSignedUrl(new URL(question.image).pathname);
            question = {
                ...question.toObject(),
                imageUrl: url,
            };
        }
        if (question.questionType.startsWith("image")) {
            const optionUrls = await Promise.all(
                question.options.map(async (option: any) => {
                    if (!option.key) throw new Error("Option is empty");
                            return await generateSignedUrl(option.key, 60);
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