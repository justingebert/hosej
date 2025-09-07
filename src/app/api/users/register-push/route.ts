import {NextRequest, NextResponse} from 'next/server';
import dbConnect from "@/lib/dbConnect";
import User from '@/db/models/user';
import {NotFoundError, ValidationError} from "@/lib/api/errorHandling";
import {AuthedContext, withAuthAndErrors} from "@/lib/api/withAuth";

export const POST = withAuthAndErrors(async (req: NextRequest, {userId}: AuthedContext) => {
    await dbConnect();

    const {token} = await req.json();
    if (!token) {
        throw new ValidationError("Token is required");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new NotFoundError("User not found");
    }

    if (user.fcmToken === token) {
        return NextResponse.json({message: 'Token already exists'}, {status: 200});
    }

    user.fcmToken = token;
    await user.save();

    return NextResponse.json({message: "Token registered successfully"}, {status: 201});
});
