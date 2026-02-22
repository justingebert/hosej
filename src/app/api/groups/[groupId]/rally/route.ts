import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getActiveRallies, createRally } from "@/lib/services/rally";

export const revalidate = 0;

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string };
        }>
    ) => {
        const result = await getActiveRallies(userId, params.groupId);
        return NextResponse.json(result);
    }
);

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string };
        }>
    ) => {
        const { task, lengthInDays } = await req.json();
        await createRally(userId, params.groupId, { task, lengthInDays });
        return NextResponse.json({ message: "Rally created successfully" });
    }
);
