import dbConnect from "@/lib/dbConnect";
import { User } from "@/db/models";
import { withErrorHandling } from "@/lib/apiMiddleware";

async function disconnectHandler(req: Request): Promise<Response> {
    const userId = req.headers.get("x-user-id") as string;
    const { deviceId } = await req.json();

    if (!deviceId) {
        return Response.json({ message: "No deviceId provided" }, { status: 400 });
    }

    await dbConnect();

    const googleUser = await User.findById(userId);
    if (!googleUser) {
        return Response.json({ message: "Google user not found" }, { status: 404 });
    }

    googleUser.deviceId = deviceId;
    googleUser.googleId = undefined;
    googleUser.googleConnected = false;
    await googleUser.save();

    return Response.json({ message: "Google account successfully unlinked." }, { status: 200 });
}

export const POST = withErrorHandling(disconnectHandler);
export interface disconnectGoogleRequest {
    deviceId: string;
}

export interface disconnectGoogleResponse {
    message: string;
}
