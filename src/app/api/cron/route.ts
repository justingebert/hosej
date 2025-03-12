import dbConnect from "@/lib/dbConnect";
import { sendNotification } from "@/utils/sendNotification";
import { withErrorHandling } from "@/lib/apiErrorHandling";
import { Group, Question, Chat, Jukebox } from "@/db/models";
import { IGroup, IQuestion } from "@/types/models";

export const revalidate = 0;
export const GET = withErrorHandling(cronHandler);

async function cronHandler(req: Request): Promise<Response> {
    await dbConnect();

    const groups = await Group.find({});
    for (const group of groups) {
        await updateQuestions(group);

        if (group.jukebox) {
            await handleJukebox(group);
        }
    }

    return Response.json({ message: "cron executed successfully" },{ status: 200 });
}

async function updateQuestions(group: IGroup) {
    const questions = await selectNewQuestions(group._id.toString(), group.questionCount);
    if (questions.length === 0) {
        await sendNotification(
            "🥗DA HABEN WIR DEN SALAT🥗",
            `${group.name} HAT KEINE FRAGEN MEHR, AN DIE ARBEIT!!`,
            group._id.toString()
        );
    } else {
        await sendNotification(`🚨Neue ${group.name} Fragen!🚨`, "JETZT VOTEN DU FISCH 🐟", group._id.toString());
        group.lastQuestionDate = new Date();
        await group.save();
    }
}

async function selectNewQuestions(groupId: string, limit: number): Promise<IQuestion[]> {
    try {
        await dbConnect();

        await deactivateCurrentQuestions(groupId);

        let newQuestions: IQuestion[] = await getNewQuestions(groupId, limit);

        return newQuestions;
    } catch (error: any) {
        throw new Error(error);
    }
}

async function deactivateCurrentQuestions(groupId: string) {
    const currentQuestions = await Question.find({ groupId: groupId, category: "Daily", active: true });
    for (const question of currentQuestions) {
        question.active = false;
        await question.save();
    }
}

async function getNewQuestions(groupId: string, limit: number): Promise<IQuestion[]> {
    let newQuestions: IQuestion[] = [];
    newQuestions = await Question.find({
        groupId: groupId,
        category: "Daily",
        used: false,
        active: false,
    })
        .sort({ createdAt: 1 })
        .limit(limit);

    for (const question of newQuestions) {
        question.active = true;
        question.used = true;
        question.usedAt = new Date();
        await question.save();
    }
    return newQuestions;
}

async function handleJukebox(group: IGroup) {
    const today = new Date();
    const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(today);
    if (today.getDate() === 6) {
        await Jukebox.updateMany({ active: true, groupId: group._id }, { active: false });
        const newJukebox = await new Jukebox({ groupId: group._id, date: today, active: true }).save();
        const newChat = await new Chat({
            groupId: group._id,
            entityModel: "Jukebox",
            entity: newJukebox._id,
        }).save();
        newJukebox.chat = newChat._id;
        await newJukebox.save();
        await newChat.save();

        await sendNotification(`🎶JUKEBOX - ${monthName} 🎶`, "🎶JETZT SONG ADDEN DU EI🎶", group._id.toString());
    }
}
