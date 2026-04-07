import { useEffect, useRef } from "react";

/**
 * Marks a feature as seen for the current user in a group.
 * Fires once on mount (when groupId is available).
 */
export function useMarkFeatureSeen(
    groupId: string | undefined,
    feature: "question" | "rally" | "jukebox"
) {
    const markedRef = useRef(false);

    useEffect(() => {
        if (!groupId || markedRef.current) return;
        markedRef.current = true;

        fetch(`/api/groups/${groupId}/activity/seen`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feature }),
        }).catch(() => {
            markedRef.current = false;
        });
    }, [groupId, feature]);
}
