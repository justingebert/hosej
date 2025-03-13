import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { CREATED_RALLY_POINTS } from "@/db/POINT_CONFIG";
import { withErrorHandling } from "@/lib/apiErrorHandling";
import { Chat, Group, Rally, User } from "@/db/models";

export const revalidate = 0;

async function getRalliesHandler(req: Request, { params }: { params: { groupId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    const { groupId } = params;

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }
    await dbConnect();

    const rallies = await Rally.find({ groupId: groupId, active: true, used: true });

    return Response.json({ rallies: rallies }, { status: 200 });
}

async function createRallyHandler(req: Request, { params }: { params: { groupId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    const { groupId } = params;
    const { task, lengthInDays } = await req.json();

    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }

    await dbConnect();

    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }
    const submittingUser = await User.findById(userId);

    const newRally = new Rally({
        groupId: groupId,
        task: task,
        lengthInDays: lengthInDays,
        submittedBy: submittingUser._id,
    });
    await newRally.save();

    const newChat = new Chat({
        group: groupId,
        entity: newRally._id,
        entityModel: "Rally",
        messages: [],
    });
    await newChat.save();

    newRally.chat = newChat._id;
    await newRally.save();

    await group.addPoints(submittingUser._id, CREATED_RALLY_POINTS);

    return Response.json({ message: "Rally created successfully" }, { status: 201 });
}

export const GET = withErrorHandling(getRalliesHandler);
export const POST = withErrorHandling(createRallyHandler);
