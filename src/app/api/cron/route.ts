import type { NextRequest } from "next/server";
import dbConnect from "@/db/dbConnect";
import Group from "@/db/models/Group";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { assertCronAuth } from "@/lib/api/cronAuth";
import { activateSmartQuestions } from "@/lib/services/question";
import { activateJukeboxes } from "@/lib/services/jukebox";
import { processRallyStateTransitions } from "@/lib/services/rally";
import { sendNotification } from "@/lib/integrations/push";
import { notify } from "@/lib/integrations/expoPush";
import { NotificationEvent } from "@/lib/notifications/templates";
import { NextResponse } from "next/server";

//gets, populates and returns daily questions
export const GET = withErrorHandling(async (req: NextRequest) => {
    assertCronAuth(req);
    await dbConnect();

    const groups = await Group.find({});
    // Every group runs every feature — there is no per-group or global gating.
    //TODO this sends multiple notifications to one user could get spammy over time - somehow layer notifications into group?
    for (const group of groups) {
        try {
            // Smart activation: 1 custom + 1 template question. An empty pool is
            // silent by design — the "question jar is empty" nag was removed.
            const questions = await activateSmartQuestions(group._id);
            if (questions.length > 0) {
                await sendNotification({
                    event: NotificationEvent.QuestionNew,
                    context: { groupName: group.name },
                    groupId: group._id,
                });
                // Mobile push (Expo) — disjoint audience from the legacy FCM send above.
                await notify({
                    event: NotificationEvent.QuestionNew,
                    context: { groupName: group.name },
                    groupId: group._id,
                    prefKey: "questionNew",
                    data: { type: "questionNew", groupId: group._id.toString() },
                });
                group.features.questions.settings.lastQuestionDate = new Date();
                await group.save();
            }

            await activateJukeboxes(group);

            await processRallyStateTransitions(group._id.toString());
        } catch (error) {
            console.error(`Cron failed for group ${group._id} (${group.name}):`, error);
        }
    }

    return NextResponse.json({ message: "cron executed successfully" }, { status: 200 });
});
