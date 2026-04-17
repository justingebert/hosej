import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { parseBody } from "@/lib/validation/parseBody";
import { FeedbackSubmissionSchema } from "@/lib/validation/announcements";
import { submitFeedback } from "@/lib/services/announcements/feedback";

export const POST = withAuthAndErrors(
    async (req: NextRequest, { params, userId }: AuthedContext<{ params: { id: string } }>) => {
        const { responses } = await parseBody(req, FeedbackSubmissionSchema);
        await submitFeedback(userId, params.id, responses);
        return NextResponse.json({ ok: true }, { status: 200 });
    }
);
