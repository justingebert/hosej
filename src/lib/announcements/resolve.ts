import type { IUser } from "@/types/models/user";
import type { StaticAnnouncement } from "./registry";
import { STATIC_ANNOUNCEMENTS } from "./registry";

export type ResolvedAnnouncement = StaticAnnouncement;

const GOOGLE_NUDGE_ID = "nudge:google-connect";
const GOOGLE_NUDGE_MIN_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export function resolveNextAnnouncement(
    user: IUser,
    announcements: readonly StaticAnnouncement[] = STATIC_ANNOUNCEMENTS
): ResolvedAnnouncement | null {
    const seen = new Set(user.announcementsSeen ?? []);

    const createdAtMs =
        user.createdAt instanceof Date
            ? user.createdAt.getTime()
            : new Date(user.createdAt).getTime();
    const isEligibleForGoogleNudge =
        !user.googleConnected &&
        Number.isFinite(createdAtMs) &&
        createdAtMs <= Date.now() - GOOGLE_NUDGE_MIN_AGE_MS &&
        !seen.has(GOOGLE_NUDGE_ID);

    // if (isEligibleForGoogleNudge) {
    //     return {
    //         kind: "cta",
    //         id: GOOGLE_NUDGE_ID,
    //         title: "Hey, Please Think About Securing your account",
    //         body: "Connect Google so you don't lose your groups if your browser data gets cleared.",
    //         cta: { label: "Open settings", href: "/settings" },
    //         publishedAt: new Date(0).toISOString(),
    //     };
    // }

    const next = announcements.find(
        (a) => !seen.has(a.id) && new Date(a.publishedAt) > user.createdAt
    );
    if (next) {
        return next;
    }

    return null;
}
