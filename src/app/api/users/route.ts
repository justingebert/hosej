import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { RateLimitError, withErrorHandling } from "@/lib/api/errorHandling";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { authLimiter } from "@/lib/rateLimit";
import { getUserById, createDeviceUser, updateUser } from "@/lib/services/user/user";
import { parseBody } from "@/lib/validation/parseBody";
import { CreateDeviceUserSchema, UpdateUserSchema } from "@/lib/validation/users";

export const GET = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const user = await getUserById(userId);
    return NextResponse.json(user, { status: 200 });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
    if (authLimiter) {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const { success, reset } = await authLimiter.limit(ip);
        if (!success) {
            const retryAfter = Math.max(Math.ceil((reset - Date.now()) / 1000), 1);
            throw new RateLimitError(retryAfter);
        }
    }

    const { deviceId, userName } = await parseBody(req, CreateDeviceUserSchema);
    const user = await createDeviceUser(deviceId, userName);
    return NextResponse.json(user, { status: 201 });
});

export const PUT = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const body = await parseBody(req, UpdateUserSchema);
    const user = await updateUser(userId, body);
    return NextResponse.json(user, { status: 200 });
});
