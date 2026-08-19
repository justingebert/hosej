import * as Sentry from "@sentry/nextjs";
import Report from "@/db/models/Report";
import { isUserInGroup } from "@/lib/services/group";
import type { ReportDocument } from "@/types/models/report";
import type { CreateReportInput } from "@/lib/validation/reports";

/**
 * File a content report. Reports are a moderation *inbox*, not an action: they
 * land in the collection and raise a Sentry warning so a human can look and, if
 * needed, remove the content or the account. Hiding a person's content for
 * yourself is a separate, client-side concern (the app's block list).
 *
 * `reportedUser` is whoever the client says posted it. That's fine for triage —
 * every report is attributable to a group member, and the unique index caps each
 * reporter at one report per thing — but treat the field as a hint, not proof:
 * always confirm against the content before acting on an account.
 *
 * Returns null when this reporter already reported this target.
 */
export async function createReport(
    reporterId: string,
    input: CreateReportInput
): Promise<ReportDocument | null> {
    // Only a member of the group can report content inside it.
    if (input.groupId) await isUserInGroup(reporterId, input.groupId);

    try {
        const report = await Report.create({
            reporter: reporterId,
            reportedUser: input.reportedUser ?? null,
            group: input.groupId ?? null,
            targetType: input.targetType,
            targetId: input.targetId,
            content: input.content,
        });

        Sentry.captureMessage(`Content reported (${input.targetType})`, {
            level: "warning",
            extra: {
                reportId: report._id.toString(),
                reporter: reporterId,
                reportedUser: input.reportedUser ?? null,
                group: input.groupId ?? null,
                targetType: input.targetType,
                targetId: input.targetId,
                content: input.content,
            },
        });

        return report;
    } catch (error) {
        // Duplicate (reporter, targetType, targetId) — already reported, nothing to do.
        if (isDuplicateKeyError(error)) return null;
        throw error;
    }
}

function isDuplicateKeyError(error: unknown): boolean {
    return (
        typeof error === "object" && error !== null && (error as { code?: number }).code === 11000
    );
}
