import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import User from "@/db/models/User";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";

export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    await dbConnect();

    const { token } = await req.json();
    if (!token) {
        throw new ValidationError("Token is required");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new NotFoundError("User not found");
    }

    if (user.fcmToken === token) {
        return NextResponse.json({ message: "Token already exists" }, { status: 200 });
    }

    user.fcmToken = token;
    await user.save();

    return NextResponse.json({ message: "Token registered successfully" }, { status: 201 });
});
