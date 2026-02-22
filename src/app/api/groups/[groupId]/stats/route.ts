import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getGroupStats } from "@/lib/services/group";

export const revalidate = 0;

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const stats = await getGroupStats(userId, params.groupId);
        return NextResponse.json(stats, { status: 200 });
    }
);
