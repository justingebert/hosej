import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import User from "@/db/models/user";
import { ConflictError, NotFoundError, ValidationError, withErrorHandling } from "@/lib/api/errorHandling";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";

interface CreateUserRequest {
    deviceId: string;
    userName: string;
}

export const GET = withAuthAndErrors(async (req: NextRequest, {userId}: AuthedContext) => {
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
        throw new NotFoundError("User not found");
    }

    return NextResponse.json(user, {status: 200});
});

export const POST = withErrorHandling(async (req: NextRequest) => {
    await dbConnect();

    const {deviceId, userName}: CreateUserRequest = await req.json();
    if (!deviceId || !userName) {
        throw new ValidationError("Device ID and username are required");
    }

    const existingUser = await User.findOne({deviceId});
    if (existingUser) {
        throw new ConflictError("User with this device ID already exists");
    }

    const newUser = new User({
        username: userName,
        deviceId,
    });
    await newUser.save();

    return NextResponse.json(newUser, {status: 201});
});

export const PUT = withAuthAndErrors(async (req: NextRequest, {userId}: AuthedContext) => {
    await dbConnect();

    const {...data} = await req.json();

    // Do not allow deviceId to be updated
    delete data.deviceId;

    const updatedUser = await User.findByIdAndUpdate(userId, data, {new: true});
    if (!updatedUser) {
        throw new NotFoundError("User not found");
    }

    return NextResponse.json(updatedUser, {status: 200});
});
