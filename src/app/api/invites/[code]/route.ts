import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import { withErrorHandling } from "@/lib/api/errorHandling";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { inviteLimiter } from "@/lib/rateLimit";
import { getInvitePreviewByCode, joinGroupByCode } from "@/lib/services/group";

// GET /api/invites/[code] — PUBLIC invite preview (no auth; the path is whitelisted
// in proxy.ts). Returns only { name, memberCount } — never the groupId. Brute-force
// is bounded by the proxy's per-IP generalLimiter plus the ~46-bit code keyspace.
export const GET = withErrorHandling(
    async (_req: NextRequest, { params }: { params: { code: string } }) => {
        const preview = await getInvitePreviewByCode(params.code);
        return NextResponse.json(preview, { status: 200 });
    }
);

// POST /api/invites/[code] — join the group behind the code. Authed + per-user
// rate-limited. Idempotent: an existing member gets 200 with the group, no error.
export const POST = withAuthAndErrors(
    withRateLimit(
        inviteLimiter,
        async (
            _req: NextRequest,
            { params, userId }: AuthedContext<{ params: { code: string } }>
        ) => {
            const group = await joinGroupByCode(userId, params.code);
            return NextResponse.json({ group }, { status: 200 });
        }
    )
);
