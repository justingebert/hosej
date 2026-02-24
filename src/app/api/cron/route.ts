import type { NextRequest } from "next/server";
import dbConnect from "@/db/dbConnect";
import Group from "@/db/models/Group";
import { AuthError, withErrorHandling } from "@/lib/api/errorHandling";
import { activateSmartQuestions } from "@/lib/services/question";
import { activateJukeboxes } from "@/lib/services/jukebox";
import { processRallyStateTransitions } from "@/lib/services/rally";
import { getGlobalConfig } from "@/lib/services/user";
import { sendNotification } from "@/lib/sendNotification";
import { NextResponse } from "next/server";
import { env } from "@/env";

//gets, populates and returns daily questions
export const GET = withErrorHandling(async (req: NextRequest) => {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
        throw new AuthError("Invalid cron secret");
    }
    await dbConnect();

    const globalConfig = await getGlobalConfig();
    const groups = await Group.find({});
    //TODO this sends multiple notifications to one user could get spammy over time - somehow layer notifications into group?
    for (const group of groups) {
        try {
            // Smart activation: 1 custom + 1 template question
            if (
                globalConfig.features.questions.status === "enabled" &&
                group.features.questions.enabled
            ) {
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
            }

            //jukebox logic
            if (
                globalConfig.features.jukebox.status === "enabled" &&
                group.features.jukebox.enabled
            ) {
                await activateJukeboxes(group);
            }

            // Rally state transitions
            if (
                globalConfig.features.rallies.status === "enabled" &&
                group.features.rallies.enabled
            ) {
                await processRallyStateTransitions(group._id.toString());
            }
        } catch (error) {
            console.error(`Cron failed for group ${group._id} (${group.name}):`, error);
        }
    }

    return NextResponse.json({ message: "cron executed successfully" }, { status: 200 });
});
