import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext} from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";

import { getGlobalConfig } from "@/lib/userAuth";

export const revalidate = 0;

export const GET = withAuthAndErrors(async (req: NextRequest, { userId }: AuthedContext) => {
    const config = await getGlobalConfig();

    return NextResponse.json(
        {
            questions: config.features.questions,
            rallies: config.features.rallies,
            jukebox: config.features.jukebox,
        },
        { status: 200 }
    );
});
