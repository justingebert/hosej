import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getGroupHistory } from "@/lib/services/group";
import { parseQuery } from "@/lib/validation/parseBody";
import { GroupHistoryQuerySchema } from "@/lib/validation/groups";

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const { limit, offset } = parseQuery(req.nextUrl.searchParams, GroupHistoryQuerySchema);

        const questions = await getGroupHistory(userId, params.groupId, limit, offset);
        if (!questions) {
            return NextResponse.json({ message: "No questions available" });
        }
        return NextResponse.json({ questions });
    }
);
