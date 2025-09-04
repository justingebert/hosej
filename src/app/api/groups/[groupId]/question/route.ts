import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import User from "@/db/models/user";
import {type NextRequest, NextResponse} from "next/server";
import Chat from "@/db/models/Chat";
import Group from "@/db/models/Group";
import {isUserInGroup} from "@/lib/groupAuth";
import {CREATED_QUESTION_POINTS} from "@/db/POINT_CONFIG";
import {ForbiddenError, ValidationError} from "@/lib/api/errorHandling";
import {withAuthAndErrors} from "@/lib/api/withAuth";

export const revalidate = 0;

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        {params, userId}: { params: { groupId: string }; userId: string }
    ) => {
        const {groupId} = params;

        const authCheck = await isUserInGroup(userId, groupId);
        if (!authCheck.isAuthorized) {
            throw new ForbiddenError(authCheck.message);
        }
        await dbConnect();

        const data = await req.json();
        const {category, questionType, question, submittedBy, image} = data;
        if (!groupId || !category || !questionType || !question || !submittedBy) {
            throw new ValidationError("Missing required fields");
        }

        // Populate options based on question type
        let options = data.options || [];
        if (questionType.startsWith("users-") && options.length === 0) {
            const group = await Group.findById(groupId);
            options = group.members.map((member: any) => member.name);
        } else if (questionType.startsWith("rating") && options.length === 0) {
            options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        }

        const newQuestion = new Question({
            groupId: groupId,
            category: category,
            questionType: questionType,
            question: question,
            image: image,
            options: options,
            submittedBy: submittedBy,
        });

        await newQuestion.save();

        const newChat = new Chat({
            group: groupId,
            entity: newQuestion._id,
            entityModel: "Question",
            messages: [],
        });

        await newChat.save();
        newQuestion.chat = newChat._id;
        await newQuestion.save();

        //TODO pass from context
        const group = await Group.findById(groupId);
        const submittingUser = await User.findById(submittedBy);
        await group.addPoints(submittingUser._id, CREATED_QUESTION_POINTS);

        return NextResponse.json({newQuestion}, {status: 201});
    }
);
