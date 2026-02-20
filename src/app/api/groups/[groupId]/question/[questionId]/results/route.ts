import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import { isUserInGroup } from "@/lib/userAuth";
import { generateSignedUrl } from "@/lib/generateSingledUrl";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError } from "@/lib/api/errorHandling";
import type { IAnswer } from "@/types/models/question";
import type { IUser } from "@/types/models/user";

export const revalidate = 0;

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string; questionId: string } }>
    ) => {
        const { groupId, questionId } = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        type PopulatedAnswer = Omit<IAnswer, "user"> & { user: Pick<IUser, "username"> | null };

        const question = await Question.findById(questionId).populate<{
            answers: PopulatedAnswer[];
        }>({
            path: "answers.user",
            model: User,
            select: "username",
        });

        if (!question) {
            throw new NotFoundError("Question not found");
        }

        const group = await Group.findById(groupId).orFail();
        const totalUsers = group.members.length;

        const totalVotes = question.answers.length || 0;

        type VoteDetail = { count: number; users: string[] };

        const voteDetails: Record<string, VoteDetail> = {};
        for (const answer of question.answers) {
            const username = answer.user?.username ?? "Unknown";

            const rawResponses = Array.isArray(answer.response)
                ? answer.response
                : [answer.response];
            for (const response of rawResponses) {
                if (typeof response !== "string" || response.length === 0) continue;

                voteDetails[response] = voteDetails[response] || { count: 0, users: [] };
                voteDetails[response].count += 1;
                voteDetails[response].users.push(username);
            }
        }

        // Calculate results with percentages
        const results = await Promise.all(
            Object.entries(voteDetails).map(async ([option, detail]) => {
                const percentage =
                    totalVotes === 0 ? 0 : Math.round((detail.count / totalVotes) * 100);
                let signedOption = option;

                // Generate signed URLs for image responses
                if (question.questionType.startsWith("image")) {
                    const { url } = await generateSignedUrl(option);
                    signedOption = url;
                }

                return {
                    option: signedOption,
                    count: detail.count,
                    percentage,
                    users: detail.users,
                };
            })
        );

        // Sort results by the number of votes (descending)
        results.sort((a, b) => b.count - a.count);

        return NextResponse.json(
            { results, totalVotes, totalUsers, questionType: question.questionType },
            { status: 200 }
        );
    }
);
