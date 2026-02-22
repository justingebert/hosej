import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { ForbiddenError, ValidationError } from "@/lib/api/errorHandling";
import { isGlobalAdmin } from "@/lib/services/admin";
import { createQuestionTemplatesFromArray } from "@/lib/template-questions/createTemplateQuestions";

export const revalidate = 0;

/**
 * POST /api/admin/question-templates/bulk
 * Upload question templates from JSON array
 * Requires global admin privileges
 */
export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    await dbConnect();

    const isAdmin = await isGlobalAdmin(userId);
    if (!isAdmin) {
        throw new ForbiddenError("Global admin access required");
    }

    const body = await req.json();
    const { packId, templates } = body;

    if (!packId) {
        throw new ValidationError("packId is required");
    }

    if (!templates) {
        throw new ValidationError("templates array is required");
    }

    const result = await createQuestionTemplatesFromArray(packId, templates);

    return NextResponse.json(
        {
            success: true,
            packId,
            ...result,
        },
        { status: 201 }
    );
});
