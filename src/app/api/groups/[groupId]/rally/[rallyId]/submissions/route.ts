import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { getSubmissions, addSubmission } from "@/lib/services/rally";
import { parseBody } from "@/lib/validation/parseBody";
import { AddRallySubmissionSchema } from "@/lib/validation/rally";

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; rallyId: string };
        }>
    ) => {
        const submissions = await getSubmissions(userId, params.groupId, params.rallyId);
        return NextResponse.json({ submissions });
    }
);

export const POST = withAuthAndErrors(
    async (
        req: NextRequest,
        {
            params,
            userId,
        }: AuthedContext<{
            params: { groupId: string; rallyId: string };
        }>
    ) => {
        const { imageUrl } = await parseBody(req, AddRallySubmissionSchema);
        const updatedRally = await addSubmission(userId, params.groupId, params.rallyId, imageUrl);
        return NextResponse.json({
            message: "Picture submission added successfully",
            updatedRally,
        });
    }
);
