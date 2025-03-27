import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { CREATED_QUESTION_POINTS } from "@/db/POINT_CONFIG";
import { withErrorHandling } from "@/lib/apiMiddleware";
import { Chat, Group, Question } from "@/db/models";
import { generateSignedUrl } from "@/lib/generateSignedUrl";

export const revalidate = 0;

export async function getQuestionsHandler(req: Request, { params }: { params: { groupId: string } }) {
    const { groupId } = params;
    const userId = req.headers.get("x-user-id") as string;

    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }
    await dbConnect();

    let questions = await Question.find({
        groupId: groupId,
        category: "Daily",
        used: true,
        active: true,
    });

    if (!questions) {
        return Response.json({ questions: [], message: "No questions left" }, { status: 200 });
    }

    const userCount = group.members.length;
    const totalVotes = questions.reduce((acc, question) => acc + (question.answers?.length || 0), 0);
    const completionPercentage = ((totalVotes / (questions.length * userCount)) * 100).toFixed(0);

    questions = questions.map((question) => {
        question.userHasVoted = question.answers.some((answer: { user: string }) => answer.user.toString() === userId);
        question.userRating = question.rating.good.some((id) => id.toString() === userId)
            ? "good"
            : question.rating.ok.some((id: mongoose.Types.ObjectId) => id.toString() === userId)
            ? "ok"
            : question.rating.bad.some((id: mongoose.Types.ObjectId) => id.toString() === userId)
            ? "bad"
            : null;
        return question;
    });

    const questionsWithImages = await Promise.all(
        questions.map(async (question) => {
            if (question.image) {
                const { url } = await generateSignedUrl(new URL(question.image).pathname);
                question.imageUrl = url;
            }
            if (question.questionType.startsWith("image")) {
                const optionWithActiveUrls = await Promise.all(
                    question.options.map(async (option: any) => {
                        if (!option.key) throw new Error("Option is empty");
                        return await generateSignedUrl(option.key, 60);
                    })
                );
                question.options = optionWithActiveUrls;
            }
            return question;
        })
    );

    return Response.json({ questions: questionsWithImages, completionPercentage });
}

async function createQuestionHandler(req: Request, { params }: { params: { groupId: string } }) {
    const { groupId } = params;
    const userId = req.headers.get("x-user-id") as string;

    await dbConnect();
    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }
    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }

    const { category, questionType, question, submittedBy, image, options } = await req.json();
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

    return Response.json(newQuestion, { status: 201 });
}

export const GET = withErrorHandling(getQuestionsHandler);
export const POST = withErrorHandling(createQuestionHandler);
