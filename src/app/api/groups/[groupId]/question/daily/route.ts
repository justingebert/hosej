import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from 'next/server';
import { isUserInGroup } from "@/lib/groupAuth";
import { generateSignedUrl } from "@/lib/question/questionOptions";
import Group from "@/db/models/Group";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

export const revalidate = 0;

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
        

        const group = await Group.findById(groupId);
        const userCount = group.members.length;
        const totalVotes = questions.reduce((acc, question) => acc + (question.answers?.length || 0), 0);
        const completionPercentage = (totalVotes / (questions.length * userCount)) * 100;

        // Map over questions and conditionally add pre-signed image URLs if an image is present
        const questionsWithImages = await Promise.all(
            questions.map(async (question) => {
                let questionWithImage = question.toObject();

                // Handle main question image
                if (question.image) {
                    const { url } = await generateSignedUrl(new URL(question.image).pathname);
                    questionWithImage.imageUrl = url;
                }

                // Handle question options if they are images
                if (question.questionType.startsWith("image")) {
                    const optionWithActiveUrls = await Promise.all(
                        question.options.map(async (option: any) => {
                            if (!option.key) throw new Error("Option is empty");
                            return await generateSignedUrl(option.key, 60);
                        })
                    );

                    questionWithImage.options = optionWithActiveUrls; // Replace options with signed URLs
                }

                return questionWithImage;
            })
        );

        return NextResponse.json({ questions: questionsWithImages, completionPercentage });
    } catch (error:any) {
        console.error(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
