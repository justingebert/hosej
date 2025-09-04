import dbConnect from "@/lib/dbConnect";
import { sendNotification } from "@/utils/sendNotification";
import { withErrorHandling } from "@/lib/apiMiddleware";
import { Group, Question, Chat, Jukebox, Rally } from "@/db/models";
import { IGroup, IQuestion, IRally } from "@/types/models";

export const revalidate = 0;
export const GET = withErrorHandling(cronHandler);

async function cronHandler(req: Request): Promise<Response> {
    await dbConnect();

    const groups = await Group.find({});
    for (const group of groups) {
        await updateQuestions(group);

        if (group.rally) {
            await handleRally(group);
        }

        if (group.jukebox) {
            await handleJukebox(group);
        }
    }

    return Response.json({ message: "cron executed successfully" }, { status: 200 });
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
    if (today.getDate() === 1) {
        await Jukebox.updateMany({ active: true, groupId: group._id }, { active: false });
        const newJukebox = await new Jukebox({ groupId: group._id, date: today, active: true }).save();
        const newChat = await new Chat({
            group: group._id,
            entityModel: "Jukebox",
            entity: newJukebox._id,
        }).save();
        newJukebox.chat = newChat._id;
        await newJukebox.save();
        await newChat.save();

        await sendNotification(`🎶JUKEBOX - ${monthName} 🎶`, "🎶JETZT SONG ADDEN DU EI🎶", group._id.toString());
    }
}

async function handleRally(group: IGroup) {
    const currentDay = new Date().setHours(0, 0, 0, 0);

    const rallies = await Rally.find({ groupId: group._id, active: true });

    if (rallies.length === 0) {
        const newRallies = await activateRallies(group, group.rallyCount);
        if (newRallies.length === 0) {
            console.log("CRON: No rallies left");
            return;
        }
        await sendNotification(
            `📷 New ${group.name} Rally Started! 📷`,
            "📷 PARTICIPATE NOW! 📷",
            group._id.toString()
        );
        return;
    }

    const ralliesToStart = rallies.filter((rally) => {
        if (!rally.used && rally.startTime) {
            return currentDay >= new Date(rally.startTime).getTime();
        }
        return false;
    });
    for (let rally of ralliesToStart) {
        rally.used = true;
        await rally.save();
        await sendNotification(
            `📷 New ${group.name} Rally Started! 📷`,
            "📷 PARTICIPATE NOW! 📷",
            group._id.toString()
        );
    }

    const activeRalliesActionNeeded = rallies.filter((rally) => {
        if (rally.used && rally.endTime) {
            return currentDay >= new Date(rally.endTime).getTime();
        }
        return false;
    });

    for (let rally of activeRalliesActionNeeded) {
        // activate Voting phase
        if (!rally.votingOpen && !rally.resultsShowing) {
            rally.votingOpen = true;
            rally.endTime = new Date(currentDay + 24 * 60 * 60 * 1000); // 1 day for voting
            await rally.save();

            await sendNotification(`📷${group.name} Rally Voting! 📷`, "📷 VOTE NOW 📷", group._id.toString());
        }
        // activate Results phase
        else if (rally.votingOpen) {
            rally.votingOpen = false;
            rally.resultsShowing = true;
            rally.endTime = new Date(currentDay + 24 * 60 * 60 * 1000); // 1 day for results viewing
            await rally.save();

            await sendNotification(`📷 ${group.name} Rally Results! 📷`, "📷 VIEW NOW 📷", group._id.toString());
        }
        // end rally and active new ones
        else if (rally.resultsShowing) {
            rally.resultsShowing = false;
            rally.active = false;
            rally.endTime = new Date(currentDay);
            await rally.save();

            await activateRallies(group, 1);
        }
    }
}

async function activateRallies(group: IGroup, count: number): Promise<IRally[]> {
    const currentDay = new Date().setHours(0, 0, 0, 0);
    const gapEndTime = new Date(currentDay + group.rallyGapDays * 24 * 60 * 60 * 1000);

    const newRallies = await Rally.find({
        groupId: group._id,
        active: false,
        used: false,
    }).limit(count);

    if (newRallies.length === 0) {
        console.log("CRON: No rallies left");
        return [];
    }

    for (let rally of newRallies) {
        rally.active = true;
        rally.startTime = gapEndTime; // New rally starts after the gap phase
        rally.endTime = new Date(gapEndTime.getTime() + rally.lengthInDays * 24 * 60 * 60 * 1000); // Set end time based on lengthInDays
        await rally.save();
    }

    return newRallies;
}
