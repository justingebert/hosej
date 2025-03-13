import dbConnect from "@/lib/dbConnect";
import { withErrorHandling } from "@/lib/apiMiddleware";
import { Group, User } from "@/db/models";

export const revalidate = 0;

async function createGroupHandler(req: Request) {
    const userId = req.headers.get("x-user-id") as string;
    const { name } = await req.json();
    await dbConnect();

    const user = await User.findById(userId);

    const member = {
        user: user._id,
        name: user.username,
    };
    const newGroup = new Group({
        name: name,
        admin: user._id,
        members: [member],
    });
    await newGroup.save();

    user.groups.push(newGroup._id);
    await user.save();

    return Response.json({ newGroup: newGroup }, { status: 201 });
}

async function getGroupsHandler(req: Request) {
    const userId = req.headers.get("x-user-id");
    await dbConnect();

    const user = await User.findById(userId).populate({ path: "groups", model: Group });

    return Response.json({ groups: user.groups }, { status: 200 });
}

export const POST = withErrorHandling(createGroupHandler);
export const GET = withErrorHandling(getGroupsHandler);
