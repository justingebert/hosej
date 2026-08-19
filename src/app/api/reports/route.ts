import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { createReport } from "@/lib/services/report";
import { parseBody } from "@/lib/validation/parseBody";
import { CreateReportSchema } from "@/lib/validation/reports";

// Report objectionable content or a user. Always answers 202 — a duplicate report
// is a no-op, and the reporter shouldn't be told whether their earlier one landed.
export const POST = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const input = await parseBody(req, CreateReportSchema);
    await createReport(userId, input);
    return NextResponse.json({ message: "Report received" }, { status: 202 });
});
