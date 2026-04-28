import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import dbConnect from "@/db/dbConnect";
import Group from "@/db/models/Group";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { assertCronAuth } from "@/lib/api/cronAuth";
import { runRemindersForGroup } from "@/lib/services/reminders";

export const GET = withErrorHandling(async (req: NextRequest) => {
    assertCronAuth(req);
    await dbConnect();

    const groups = await Group.find({});
    for (const group of groups) {
        try {
            await runRemindersForGroup(group);
        } catch (error) {
            console.error(`Reminders cron failed for group ${group._id} (${group.name}):`, error);
        }
    }

    return NextResponse.json({ message: "reminder cron executed successfully" }, { status: 200 });
});
