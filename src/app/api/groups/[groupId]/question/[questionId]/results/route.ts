import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { isUserInGroup } from "@/lib/groupAuth";
import { generateSignedUrl } from "@/lib/question/questionOptions";
import Group from "@/db/models/Group";
import User from "@/db/models/user";


export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { groupId: string; questionId: string } }) {
    const { groupId, questionId } = params;
    const userId = req.headers.get("x-user-id") as string;

    try {
        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
            return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
        }

        await dbConnect();

        const question = await Question.findById(questionId).populate({
            path: "answers.user",
            model: User,
        });

        if (!question) {
            return NextResponse.json({ message: "Question not found" }, { status: 404 });
        }

        const group = await Group.findById(groupId);
        const totalUsers = group.members.length;
        const totalVotes = question.answers.length;

        // Group answers by response with usernames
        const voteDetails = question.answers.reduce((acc: any, answer: any) => {
            const response = answer.response;
            if (!acc[response]) {
                acc[response] = { count: 0, users: [] };
            }
            acc[response].count += 1;
            acc[response].users.push(answer.user.username);
            return acc;
        }, {});

        // Calculate results with percentages
        const results = await Promise.all(
            Object.entries(voteDetails).map(async ([option, { count, users }]: any) => {
                const percentage = Math.round((count / totalVotes) * 100);
                let signedOption = option;

                // Generate signed URLs for image responses
                if (question.questionType.startsWith("image")) {
                    const { url } = await generateSignedUrl(option);
                    signedOption = url;
                }

                return { option: signedOption, count, percentage, users };
            })
        );

        // Sort results by the number of votes (descending)
        results.sort((a, b) => b.count - a.count);

        return NextResponse.json(
            { results, totalVotes, totalUsers, questionType: question.questionType },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching question results:", questionId, error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
