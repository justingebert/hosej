import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { disconnectGoogleAccount } from "@/lib/services/user/user";
import { parseBody } from "@/lib/validation/parseBody";
import { GoogleDisconnectSchema } from "@/lib/validation/users";

export const DELETE = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const { deviceId } = await parseBody(req, GoogleDisconnectSchema);
    await disconnectGoogleAccount(userId, deviceId);
    return NextResponse.json({ message: "Google account successfully unlinked." }, { status: 200 });
});
