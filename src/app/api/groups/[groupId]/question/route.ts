import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { CREATED_QUESTION_POINTS } from "@/db/POINT_CONFIG";
import { withErrorHandling } from "@/lib/apiMiddleware";
import { Chat, Group, Question, User } from "@/db/models";

export const revalidate = 0;

async function createQuestionHandler(req: Request, { params }: { params: { groupId: string } }) {
    const { groupId } = params;
    const userId = req.headers.get("x-user-id") as string;

    await dbConnect();
    const group = await Group.findById(groupId);
    if(!group){
        return Response.json({ message: "Group not found" }, { status: 404 });
    }
    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }

    const { category, questionType, question, submittedBy, image, options} = await req.json();
    if (!groupId || !category || !questionType || !question || !submittedBy) {
        return Response.json({ message: "Missing required fields" }, { status: 400 });
    }

    let populatedOptions = options || [];
    if (questionType.startsWith("users-") && populatedOptions.length === 0) {
        populatedOptions = group.members.map((member: any) => member.name);
    } else if (questionType.startsWith("rating") && populatedOptions.length === 0) {
        populatedOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    }

    const newQuestion = new Question({
        groupId: groupId,
        category: category,
        questionType: questionType,
        question: question,
        image: image,
        options: populatedOptions,
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

    await group.addPoints(userId, CREATED_QUESTION_POINTS);

    return Response.json({ newQuestion }, { status: 201 });
}

export const POST = withErrorHandling(createQuestionHandler);
