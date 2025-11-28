import { NextRequest, NextResponse } from "next/server";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";

import { getGlobalConfig } from "@/lib/userAuth";

export const revalidate = 0;

export const GET = withAuthAndErrors(async (req: NextRequest, {userId}: AuthedContext) => {
    const config = await getGlobalConfig();

    return NextResponse.json({
        questions: config.features.questions,
        rallies: config.features.rallies,
        jukebox: config.features.jukebox,
    }, {status: 200});
});
