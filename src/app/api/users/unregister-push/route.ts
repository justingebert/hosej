import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import User from "@/db/models/user";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import type { AuthedContext} from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";

export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const { token } = await req.json();
    if (!token) {
        throw new ValidationError("Token is required");
    }

    await dbConnect();

    const result = await User.updateOne({ _id: userId }, { $unset: { fcmToken: token } });

    if (result.matchedCount === 0) {
        throw new NotFoundError("User not found");
    }

    return NextResponse.json({ message: "FCM token unregistered successfully." }, { status: 200 });
});
