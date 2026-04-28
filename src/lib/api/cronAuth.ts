import type { NextRequest } from "next/server";
import { env } from "@/env";
import { AuthError } from "@/lib/api/errorHandling";

export function assertCronAuth(req: NextRequest): void {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
        throw new AuthError("Invalid cron secret");
    }
}
