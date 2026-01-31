import dbConnect from "@/db/dbConnect";
import Chat from "@/db/models/Chat";
import Group from "@/db/models/Group";
import Jukebox from "@/db/models/Jukebox";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { activateNextQuestions } from "@/lib/question/activateQuestion";
import { sendNotification } from "@/lib/sendNotification";
import { IGroup } from "@/types/models/group";
import { NextResponse } from "next/server";

export const revalidate = 0;
/**
 * this deactivates active jukeboxes and actives new ones on the first of every month
 * @param group
 */
async function handleJukebox(group: IGroup) {
    const today = new Date();
    if (group.features.jukebox.settings.activationDays.includes(today.getDate())) {
        await Jukebox.updateMany({ active: true, groupId: group._id }, { active: false });

        for (let i = 0; i < group.features.jukebox.settings.concurrent.length; i++) {
            const newJukebox = await new Jukebox({
                groupId: group._id,
                date: today,
                active: true,
                title: group.features.jukebox.settings.concurrent[i],
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

        const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(today);
        await sendNotification(`🎶JUKEBOX - ${monthName} 🎶`, "🎶SUBMIT YOUR SONGS🎶", group._id);
    }
}

//gets, populates and returns daily questions
export const GET = withErrorHandling(async () => {
    await dbConnect();

    const groups = await Group.find({});
    //TODO this sends multiple notifications to one user this is wrong
    for (const group of groups) {
        const questions = await activateNextQuestions(group._id, group.features.questions.settings.questionCount);
        if (questions.length === 0) {
            await sendNotification(
                "🥗DA HABEN WIR DEN SALAT🥗",
                `${group.name} HAT KEINE FRAGEN MEHR, AN DIE ARBEIT!!`,
                group._id
            );
            await group.save();
        } else {
            await sendNotification(`🚨Neue ${group.name} Fragen!!🚨`, "🚨JETZT VOTEN DU FISCH🚨", group._id);
            group.features.questions.settings.lastQuestionDate = new Date();
            await group.save();
        }

        //jukebox logic
        if (group.features.jukebox.enabled) {
            await handleJukebox(group);
        }
    }

    return NextResponse.json({ message: "cron exceuted successfully" }, { status: 200 });
});
