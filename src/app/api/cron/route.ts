import dbConnect from "@/db/dbConnect";
import Group from "@/db/models/Group";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { activateSmartQuestions } from "@/lib/services/question";
import { activateJukeboxes } from "@/lib/services/jukebox";
import { sendNotification } from "@/lib/sendNotification";
import { NextResponse } from "next/server";

export const revalidate = 0;

//gets, populates and returns daily questions
export const GET = withErrorHandling(async () => {
    await dbConnect();

    const groups = await Group.find({});
    //TODO this sends multiple notifications to one user could get spammy over time - somehow layer notifications into group?
    for (const group of groups) {
        // Smart activation: 1 custom + 1 template question
        const questions = await activateSmartQuestions(group._id);
        if (questions.length === 0) {
            await sendNotification(
                "🥗DA HABEN WIR DEN SALAT🥗",
                `${group.name} HAT KEINE FRAGEN MEHR, AN DIE ARBEIT!!`,
                group._id
            );
            await group.save();
        } else {
            await sendNotification(
                `🚨Neue ${group.name} Fragen!!🚨`,
                "🚨JETZT VOTEN DU FISCH🚨",
                group._id
            );
            group.features.questions.settings.lastQuestionDate = new Date();
            await group.save();
        }

        //jukebox logic
        if (group.features.jukebox.enabled) {
            await activateJukeboxes(group);
        }
    }

    return NextResponse.json({ message: "cron exceuted successfully" }, { status: 200 });
});
