"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import fetcher from "@/lib/fetcher";
import type { ResolvedAnnouncement } from "@/lib/announcements/resolve";
import { AnnouncementDrawer } from "./AnnouncementDrawer";

type AnnouncementResponse = { announcement: ResolvedAnnouncement | null };

export function AnnouncementGate() {
    const { status, data: session } = useSession();
    const [dismissed, setDismissed] = useState(false);

    const shouldFetch =
        status === "authenticated" && session?.user?.onboardingCompleted !== false && !dismissed;

    const { data } = useSWR<AnnouncementResponse>(
        shouldFetch ? "/api/announcements/next" : null,
        fetcher,
        { revalidateOnFocus: false, revalidateIfStale: false, revalidateOnReconnect: false }
    );

    if (!shouldFetch || !data?.announcement) return null;

    return (
        <AnnouncementDrawer announcement={data.announcement} onDismiss={() => setDismissed(true)} />
    );
}
