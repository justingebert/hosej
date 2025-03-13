import { Group, User } from "@/db/models";
import { withErrorHandling } from "@/lib/apiMiddleware";
import dbConnect from "@/lib/dbConnect";
import { isUserGroupAdmin, isUserInGroup } from "@/lib/groupAuth";

export const revalidate = 0;

async function getGroupHandler(req: Request, { params }: { params: { groupId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    const { groupId } = params;
    await dbConnect();

    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }
    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
        return Response.json({ message: authCheck.message }, { status: authCheck.status });
    }

    const userIsAdmin = group.admin.equals(userId);

    return Response.json({ group: group, userIsAdmin: userIsAdmin }, { status: 200 });
}

export async function updateGroupHandler(req: Request, { params }: { params: { groupId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    const { groupId } = params;

    const data = await req.json();
    await dbConnect();

    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }

    const adminCheck = await isUserGroupAdmin(userId, groupId);
    if (!adminCheck.isAuthorized) {
        return Response.json({ message: adminCheck.message }, { status: adminCheck.status });
    }

    group.set(data);
    await group.save();

    return Response.json(group, { status: 200 });
}

async function deleteGroupHandler(req: Request, { params }: { params: { groupId: string } }) {
    const userId = req.headers.get("x-user-id") as string;
    const { groupId } = params;

    await dbConnect();

    const group = await Group.findById(groupId);
    if (!group) {
        return Response.json({ message: "Group not found" }, { status: 404 });
    }

    const adminCheck = await isUserGroupAdmin(userId, groupId);
    if (!adminCheck.isAuthorized) {
        return Response.json({ message: adminCheck.message }, { status: adminCheck.status });
    }

    for (const member of group.members) {
        const user = await User.findById(member.user);
        user.groups = user.groups.filter((group: string) => group !== groupId);
        await user.save();
    }

    await Group.findByIdAndDelete(groupId);

    return Response.json({ message: "Group deleted" }, { status: 200 });
}

export const GET = withErrorHandling(getGroupHandler);
export const PUT = withErrorHandling(updateGroupHandler);
export const DELETE = withErrorHandling(deleteGroupHandler);
