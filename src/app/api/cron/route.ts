import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/utils/sendNotification";
import Group from "@/db/models/Group";
import Jukebox from "@/db/models/Jukebox";
import Chat from "@/db/models/Chat";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { IQuestion } from "@/types/models/question";
import { Types } from "mongoose";
import { IGroup } from "@/types/models/group";

export const revalidate = 0;

//deactives current questions and activates new ones
async function selectDailyQuestions(groupId: string | Types.ObjectId, limit: number): Promise<IQuestion[]> {
    const currentQuestions = await Question.find({groupId: groupId, category: "Daily", active: true});
    for (const question of currentQuestions) {
        question.active = false;
        await question.save();
    }

    const questions = await Question.find({
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
}

/**
 * this deactivates active jukeboxes and actives new ones on the first of every month
 * @param group
 */
async function handleJukebox(group: IGroup) {
    const today = new Date();
    if (group.jukeboxSettings.activationDays.includes(today.getDate())) {
        await Jukebox.updateMany({active: true, groupId: group._id}, {active: false});

        for (let i = 0; i < group.jukeboxSettings.concurrent.length; i++) {
            const newJukebox = await new Jukebox({
                groupId: group._id,
                date: today, active: true,
                title: group.jukeboxSettings.concurrent[i]
            }).save();

            const newChat = await new Chat({
                group: group._id,
                entityModel: "Jukebox",
                entity: newJukebox._id,
            }).save();

            newJukebox.chat = newChat._id;
            await newJukebox.save();
            await newChat.save();
        }

        const monthName = new Intl.DateTimeFormat("en-US", {month: "long"}).format(today);
        await sendNotification(`🎶JUKEBOX - ${monthName} 🎶`, "🎶SUBMIT YOUR SONGS🎶", group._id);
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
        if (group.jukeboxSettings.enabled) {
            await handleJukebox(group);
        }
    }

    return NextResponse.json({message: "cron exceuted successfully"}, {status: 200});
});
