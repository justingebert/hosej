import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { voteOnSubmission } from "@/lib/services/rally";

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; rallyId: string; submissionId: string };
        }>
    ) => {
        await voteOnSubmission(userId, params.groupId, params.rallyId, params.submissionId);
        return NextResponse.json({ message: "Vote added successfully" });
    }
);
