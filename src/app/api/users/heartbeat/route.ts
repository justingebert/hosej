import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { touchLastOnline } from "@/lib/services/user";

export const POST = withAuthAndErrors(async (_req: NextRequest, { userId }: AuthedContext) => {
    await touchLastOnline(userId);
    return NextResponse.json({ ok: true }, { status: 200 });
});
