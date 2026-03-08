import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { generateConnectToken } from "@/lib/services/user/user";

export const POST = withAuthAndErrors(async (_req: NextRequest, { userId }: AuthedContext) => {
    const connectToken = await generateConnectToken(userId);
    return NextResponse.json({ connectToken });
});
