import dbConnect from "@/lib/dbConnect";
import { isUserGroupAdmin } from "@/lib/groupAuth";
import { withErrorHandling } from "@/lib/apiMiddleware";
import { Group, Rally } from "@/db/models";
import { sendNotification } from "@/utils/sendNotification";

async function activateRalliesHandler(req: Request, { params }: { params: { groupId: string } }) {
    const { groupId } = params;
    const userId = req.headers.get("x-user-id") as string;

    const authCheck = await isUserGroupAdmin(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }

    await dbConnect();
    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }

    const rallies = await Rally.find({ groupId: groupId, active: false, used: false }).limit(group.rallyCount);
    const currentTime = new Date();
    for (let rally of rallies) {
        rally.active = true;
        rally.used = true;
        rally.startTime = new Date(currentTime.getTime());
        rally.endTime = new Date(rally.startTime.getTime() + rally.lengthInDays * 24 * 60 * 60 * 1000);
        await rally.save();
    }

    await sendNotification(`📷 New ${group.name} Rally Started! 📷`, "📷 PARTICIPATE NOW! 📷", group._id.toString());

    return Response.json({ message: "Activated rallies", rallies: rallies }, { status: 200 });
}

export const POST = withErrorHandling(activateRalliesHandler);
