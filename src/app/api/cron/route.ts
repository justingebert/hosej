import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import {IQuestion} from "@/types/models/Question";
import {NextRequest, NextResponse} from "next/server";
import {sendNotification} from "@/utils/sendNotification";
import Group from "@/db/models/Group";
import Jukebox from "@/db/models/Jukebox";
import Chat from "@/db/models/Chat";
import {withErrorHandling} from "@/lib/api/errorHandling";

export const revalidate = 0;

//deactives current questions and activates new ones
async function selectDailyQuestions(groupId: string, limit: number): Promise<IQuestion[]> {
    let questions: IQuestion[] = [];
    try {
        await dbConnect();

        const currentQuestions = await Question.find({groupId: groupId, category: "Daily", active: true});
        for (const question of currentQuestions) {
            question.active = false;
            await question.save();
        }

        questions = await Question.find({
            groupId: groupId,
            category: "Daily",
            used: false,
            active: false,
        })
            .sort({createdAt: 1})
            .limit(limit);

        for (const question of questions) {
            question.active = true;
            question.used = true;
            question.usedAt = new Date();
            await question.save();
        }

        return questions;
    } catch (error: any) {
        throw new Error(error);
    }
}

//gets, populates and returns daily questions
export const GET = withErrorHandling(async (req: NextRequest) => {
    await dbConnect();

    const groups = await Group.find({});
    //TODO this sends multiple notifications to one user this is wrong
    for (const group of groups) {
        const questions = await selectDailyQuestions(group._id, group.questionCount);
        if (questions.length === 0) {
            await sendNotification(
                "🥗DA HABEN WIR DEN SALAT🥗",
                `${group.name} HAT KEINE FRAGEN MEHR, AN DIE ARBEIT!!`,
                group._id
            );
            await group.save();
        } else {
            await sendNotification(`🚨Neue ${group.name} Fragen!!🚨`, "🚨JETZT VOTEN DU FISCH🚨", group._id);
            group.lastQuestionDate = new Date();
            await group.save();
        }

        //jukebox logic
        if (group.jukebox) {
            const today = new Date();
            const monthName = new Intl.DateTimeFormat("en-US", {month: "long"}).format(today);
            if (today.getDate() === 2) {
                await Jukebox.updateMany({active: true, groupId: group._id}, {active: false});
                const newJukebox = await new Jukebox({groupId: group._id, date: today, active: true}).save();
                const newChat = await new Chat({
                    group: group._id,
                    entityModel: "Jukebox",
                    entity: newJukebox._id,
                }).save();
                newJukebox.chat = newChat._id;
                await newJukebox.save();
                await newChat.save();

                await sendNotification(`🎶JUKEBOX - ${monthName} 🎶`, "🎶JETZT SONG ADDEN DU EI🎶", group._id);
            }
        }
    }

    return NextResponse.json({message: "cron exceuted successfully"}, {status: 200});
});
