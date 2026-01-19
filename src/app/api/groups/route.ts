import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import Group from "@/db/models/Group";
import User from "@/db/models/user";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { addTemplatePackToGroup } from "@/lib/question/templates/addTemplatesToGroup";

export const revalidate = 0;

export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    await dbConnect();
    const { name } = await req.json();

    if (!name) {
        throw new ValidationError("Group name is required");
    }

    const userAdmin = await User.findById(userId);
    if (!userAdmin) {
        throw new NotFoundError("User not found");
    }

    const member = {
        user: userAdmin._id,
        name: userAdmin.username,
    };
    const newGroup = new Group({
        name: name,
        admin: userAdmin._id,
        members: [member],
    });
    await newGroup.save();

    userAdmin.groups.push(newGroup._id);
    await userAdmin.save();

    await addTemplatePackToGroup(newGroup._id, 'starter-pack');


    return NextResponse.json(newGroup, { status: 201 });
});

export const GET = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    await dbConnect();
    const user = await User.findById(userId).populate({ path: "groups", model: Group });
    if (!user) {
        throw new NotFoundError("User not found");
    }
    return NextResponse.json({ groups: user.groups }, { status: 200 });
});
