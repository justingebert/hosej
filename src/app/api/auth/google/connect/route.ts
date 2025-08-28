import dbConnect from "@/lib/dbConnect";
import { User } from "@/db/models";
import { withErrorHandling } from "@/lib/apiMiddleware";

async function connectHandler(req: Request): Promise<Response> {
    const userId = req.headers.get("x-user-id") as string;
    const { deviceId } = await req.json();
    if (!deviceId) {
        return Response.json({ message: "No deviceId provided" }, { status: 400 });
    }

    await dbConnect();

    const deviceUser = await User.findOne({ deviceId });
    if (!deviceUser) {
        return Response.json({ message: "User with deviceId not found" }, { status: 404 });
    }

    const googleUser = await User.findById(userId);

    const googleId = googleUser.googleId;
    await User.deleteOne({ _id: userId });

    deviceUser.googleId = googleId;
    deviceUser.googleConnected = true;
    deviceUser.deviceId = undefined;
    await deviceUser.save();

    return Response.json({ message: "Google account linked successfully." }, { status: 200 });
}

export const POST = withErrorHandling(connectHandler);
export interface connectGoogleRequest {
    deviceId: string;
}

export interface connectGoogleResponse {
    message: string;
}
