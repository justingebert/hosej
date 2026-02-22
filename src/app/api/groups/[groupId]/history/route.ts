import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { ValidationError } from "@/lib/api/errorHandling";
import { getGroupHistory } from "@/lib/services/group";

export const revalidate = 0;

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const limitStr = req.nextUrl.searchParams.get("limit");
        const offsetStr = req.nextUrl.searchParams.get("offset");
        if (!limitStr || !offsetStr) {
            throw new ValidationError("limit and offset are required");
        }

        const questions = await getGroupHistory(
            userId,
            params.groupId,
            parseInt(limitStr, 10),
            parseInt(offsetStr, 10)
        );
        if (!questions) {
            return NextResponse.json({ message: "No questions available" });
        }
        return NextResponse.json({ questions });
    }
);
