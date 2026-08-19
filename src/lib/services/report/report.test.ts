import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser, makeGroup } from "@/test/factories";
import { createReport } from "./report";
import Report from "@/db/models/Report";
import { ForbiddenError } from "@/lib/api/errorHandling";
import { ReportStatus, ReportTargetType } from "@/types/models/report";

vi.mock("@sentry/nextjs", () => ({ captureMessage: vi.fn() }));

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("createReport", () => {
    it("stores an open report for a member of the group", async () => {
        const reporter = await makeUser();
        const offender = await makeUser();
        const group = await makeGroup({
            members: [{ user: reporter._id }, { user: offender._id }],
        });

        const report = await createReport(reporter._id.toString(), {
            targetType: ReportTargetType.Message,
            targetId: `${group._id}:2026-08-18T10:00:00.000Z`,
            reportedUser: offender._id.toString(),
            groupId: group._id.toString(),
            content: "something nasty",
        });

        expect(report?.status).toBe(ReportStatus.Open);
        expect(report?.reportedUser?.toString()).toBe(offender._id.toString());
        expect(report?.content).toBe("something nasty");
        expect(await Report.countDocuments()).toBe(1);
    });

    it("rejects a reporter who is not in the group", async () => {
        const outsider = await makeUser();
        const group = await makeGroup();

        await expect(
            createReport(outsider._id.toString(), {
                targetType: ReportTargetType.Message,
                targetId: "some-target",
                groupId: group._id.toString(),
            })
        ).rejects.toBeInstanceOf(ForbiddenError);

        expect(await Report.countDocuments()).toBe(0);
    });

    it("ignores a repeat report of the same target by the same reporter", async () => {
        const reporter = await makeUser();
        const group = await makeGroup({ members: [{ user: reporter._id }] });
        const input = {
            targetType: ReportTargetType.RallySubmission,
            targetId: "submission-1",
            groupId: group._id.toString(),
        };

        await createReport(reporter._id.toString(), input);
        const second = await createReport(reporter._id.toString(), input);

        expect(second).toBeNull();
        expect(await Report.countDocuments()).toBe(1);
    });

    it("lets a different reporter report the same target", async () => {
        const [first, second] = [await makeUser(), await makeUser()];
        const group = await makeGroup({
            members: [{ user: first._id }, { user: second._id }],
        });
        const input = {
            targetType: ReportTargetType.RallySubmission,
            targetId: "submission-1",
            groupId: group._id.toString(),
        };

        await createReport(first._id.toString(), input);
        await createReport(second._id.toString(), input);

        expect(await Report.countDocuments()).toBe(2);
    });
});
