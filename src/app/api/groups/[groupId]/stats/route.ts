import { Types } from "mongoose";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import Rally from "@/db/models/Rally";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Chat from "@/db/models/Chat";
import Group from "@/db/models/Group";
import { isUserInGroup } from "@/lib/userAuth";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError } from "@/lib/api/errorHandling";

export const revalidate = 0;

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string };
        }>
    ) => {
        const { groupId } = params;

        await dbConnect();
        await isUserInGroup(userId, groupId);

        const group = await Group.findById(groupId);
        if (!group) throw new NotFoundError("Group not found");

        const questionsUsedCount = await Question.countDocuments({ groupId: groupId, used: true });
        const questionsLeftCount = await Question.countDocuments({ groupId: groupId, used: false });

        const questionsByType = await Question.aggregate([
            { $match: { groupId: new Types.ObjectId(groupId) } },
            { $group: { _id: "$questionType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        const questionsByUser = await Question.aggregate([
            // Step 1: Find all questions from a specific group with a valid submittedBy field
            {
                $match: {
                    groupId: new Types.ObjectId(groupId),
                    submittedBy: { $exists: true, $ne: null },
                },
            },

            // Step 2: Group by user (submittedBy) and count the number of questions
            {
                $group: {
                    _id: "$submittedBy", // Group by the user ID (submittedBy)
                    count: { $sum: 1 }, // Count how many questions each user submitted
                },
            },

            // Step 3: Fetch the user's details using a lookup (join with the users collection)
            {
                $lookup: {
                    from: "users", // Collection name where users are stored
                    localField: "_id", // Link with submittedBy field (user ID)
                    foreignField: "_id", // Match it with the _id field in users collection
                    as: "user", // Store result in a "user" field (an array)
                },
            },

            // Step 4: Simplify the user field from array to object
            {
                $unwind: "$user", // Convert the user array into a single user object
            },

            // Step 5: Project (select) only the username and question count
            {
                $project: {
                    _id: 0, // Hide the internal ID
                    username: "$user.username", // Show the user's username
                    count: 1, // Show the count of questions submitted
                },
            },

            // Step 6: Sort the results by the number of questions in descending order
            {
                $sort: { count: -1 },
            },
        ]);

        const RalliesUsedCount = await Rally.countDocuments({ groupId: groupId, used: true });
        const RalliesLeftCount = await Rally.countDocuments({ groupId: groupId, used: false });

        const messages = await Chat.aggregate([
            { $match: { group: new Types.ObjectId(groupId) } },
            { $unwind: "$messages" },
            { $count: "messagesCount" },
        ]);
        const messagesCount = messages[0]?.messagesCount || 0;

        return NextResponse.json(
            {
                group,
                questionsUsedCount,
                questionsLeftCount,
                questionsByType,
                questionsByUser,
                RalliesUsedCount,
                RalliesLeftCount,
                messagesCount,
            },
            { status: 200 }
        );
    }
);
