import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import { isUserInGroup } from "@/lib/userAuth";
import { generateSignedUrl } from "@/lib/generateSingledUrl";
import Group from "@/db/models/Group";
import User from "@/db/models/user";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError } from "@/lib/api/errorHandling";

export const revalidate = 0;

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {params, userId}: AuthedContext<{ params: { groupId: string; questionId: string } }>
    ) => {
        const {groupId, questionId} = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const question = await Question.findById(questionId).populate({
            path: "answers.user",
            model: User,
            select: "-googleId -spotifyAccessToken -spotifyRefreshToken -spotifyTokenExpiresAt -deviceId",
        });

        if (!question) {
            throw new NotFoundError("Question not found");
        }

        const group = await Group.findById(groupId).orFail();
        const totalUsers = group.members.length;

        const totalVotes = question.answers.length || 0;

        // Group answers by response with usernames
        const voteDetails = question.answers.reduce((acc: any, answer: any) => {
            const responses = Array.isArray(answer.response) ? answer.response : [answer.response];
            responses.forEach((response: any) => {
                if (!acc[response]) {
                    acc[response] = {count: 0, users: []};
                }
                acc[response].count += 1;
                acc[response].users.push(answer.user.username);
            });
            return acc;
        }, {});

        // Calculate results with percentages
        const results = await Promise.all(
            Object.entries(voteDetails).map(async ([option, {count, users}]: any) => {
                const percentage = Math.round((count / totalVotes) * 100);
                let signedOption = option;

                // Generate signed URLs for image responses
                if (question.questionType.startsWith("image")) {
                    const {url} = await generateSignedUrl(option);
                    signedOption = url;
                }

                return {option: signedOption, count, percentage, users};
            })
        );

        // Sort results by the number of votes (descending)
        results.sort((a, b) => b.count - a.count);

        return NextResponse.json(
            {results, totalVotes, totalUsers, questionType: question.questionType},
            {status: 200}
        );
    }
);
