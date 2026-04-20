import type { Session } from "next-auth";
import Link from "next/link";
import { useAppHaptics } from "@/hooks/useAppHaptics";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import type { GroupDTO } from "@/types/models/group";
import fetcher from "@/lib/fetcher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmptyGroupsGuide } from "@/app/groups/_components/emptyGroupsGuide";
import { GroupListSkeleton } from "@/app/groups/_components/groupListSkeleton";

const GROUP_VIBES = [
    "hosej-ing...",
    "gossiping...",
    "scheming...",
    "plotting...",
    "rallying...",
    "jukeboxing...",
    "squadding...",
    "huddling...",
    "bantering...",
    "vibing...",
    "yapping...",
    "pondering...",
    "musing...",
    "stirring the pot...",
    "brewing drama...",
    "conspiring...",
    "mingling...",
    "chattering...",
    "noodling...",
    "tallying votes...",
    "shuffling the deck...",
    "warming up...",
    "cooking...",
    "group-chatting...",
    "deliberating...",
    "clique-ing...",
] as const;

function randomVibe(): string {
    return GROUP_VIBES[Math.floor(Math.random() * GROUP_VIBES.length)];
}

export function GroupsList({ user }: { user?: Session["user"] }) {
    const { toast } = useToast();
    const { play } = useAppHaptics();

    const [starredGroupId, setStarredGroupId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("starredGroupId");
        if (stored) {
            setStarredGroupId(stored);
        }

        const userName = localStorage.getItem("userName");
        if (userName) {
            fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: userName }),
            });
            localStorage.removeItem("userName");
        }
    }, []);

    const handleStar = (groupId: string, e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (starredGroupId === groupId) {
            localStorage.removeItem("starredGroupId");
            setStarredGroupId(null);
        } else {
            localStorage.setItem("starredGroupId", groupId);
            setStarredGroupId(groupId);
        }
    };

    async function shareGroup(groupId: string, groupName: string) {
        const joinLink = `${window.location.origin}/join/${groupId}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join ${groupName} on HoseJ`,
                    text: `Join my group "${groupName}" on HoseJ!`,
                    url: joinLink,
                });
                return;
            } catch (err) {
                // User cancelled share or share API failed — fall through to clipboard
                if (err instanceof Error && err.name === "AbortError") return;
            }
        }

        try {
            await navigator.clipboard.writeText(joinLink);
            toast({ title: "Invite link copied!" });
        } catch (err) {
            console.error("Failed to copy to clipboard: ", err);
            toast({ title: "Failed to copy to clipboard", variant: "destructive" });
        }
    }

    const { data, isLoading } = useSWR<{ groups: GroupDTO[] }>(
        user ? `/api/groups` : null,
        fetcher
    );
    const groups = data?.groups || [];

    const vibes = useMemo(() => {
        const map: Record<string, string> = {};
        for (const g of groups) map[g._id] = randomVibe();
        return map;
    }, [data?.groups]);

    const { data: groupsActivity } = useSWR<Record<string, boolean>>(
        user ? `/api/activity/groups` : null,
        fetcher
    );

    return (
        <>
            {isLoading || !user ? (
                <GroupListSkeleton />
            ) : groups.length === 0 ? (
                <EmptyGroupsGuide />
            ) : (
                <motion.div
                    className="flex-grow py-6 pb-32 max-w-5xl mx-auto w-full"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: { transition: { staggerChildren: 0.06 } },
                        hidden: {},
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {groups.map((group) => {
                            return (
                                <motion.div
                                    key={group._id}
                                    className="relative group"
                                    variants={{
                                        hidden: { opacity: 0, y: 12, scale: 0.98 },
                                        visible: {
                                            opacity: 1,
                                            y: 0,
                                            scale: 1,
                                            transition: {
                                                type: "spring",
                                                stiffness: 260,
                                                damping: 22,
                                            },
                                        },
                                    }}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    {groupsActivity?.[group._id] && (
                                        <Badge className="absolute -top-1.5 -right-1.5 z-10 h-4 w-4 rounded-full bg-destructive animate-pulse shadow-sm shadow-destructive/20 border-border" />
                                    )}
                                    <Link
                                        href={`/groups/${group._id}/dashboard`}
                                        onClick={() => play("navigation")}
                                        transitionTypes={["drill-forward"]}
                                        className="block"
                                    >
                                        <Card className="relative cursor-pointer border shadow-sm hover:shadow-lg transition-shadow overflow-hidden rounded-2xl">
                                            <span
                                                aria-hidden
                                                className="absolute inset-y-3 left-0 w-[3px] rounded-r-full"
                                            />
                                            <CardContent className="flex justify-between items-center p-5 pl-6">
                                                <div className="flex flex-col gap-1">
                                                    <CardTitle className="tracking-tight text-xl">
                                                        {group.name}
                                                    </CardTitle>
                                                    <CardDescription className="text-sm">
                                                        {vibes[group._id]}
                                                    </CardDescription>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full hover:bg-primary/10 transition-colors"
                                                        onClick={(e) => handleStar(group._id, e)}
                                                    >
                                                        <AnimatePresence
                                                            mode="wait"
                                                            initial={false}
                                                        >
                                                            <motion.span
                                                                key={
                                                                    starredGroupId === group._id
                                                                        ? "on"
                                                                        : "off"
                                                                }
                                                                initial={{
                                                                    scale: 0.6,
                                                                    rotate: -20,
                                                                }}
                                                                animate={{ scale: 1, rotate: 0 }}
                                                                exit={{ scale: 0.6, rotate: 20 }}
                                                                transition={{
                                                                    type: "spring",
                                                                    stiffness: 500,
                                                                    damping: 18,
                                                                }}
                                                                className="inline-flex"
                                                            >
                                                                <Star
                                                                    className="w-5 h-5"
                                                                    fill={
                                                                        starredGroupId === group._id
                                                                            ? "gold"
                                                                            : "none"
                                                                    }
                                                                    color={
                                                                        starredGroupId === group._id
                                                                            ? "gold"
                                                                            : "currentColor"
                                                                    }
                                                                />
                                                            </motion.span>
                                                        </AnimatePresence>
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full hover:bg-primary/10 transition-colors"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            shareGroup(group._id, group.name);
                                                        }}
                                                    >
                                                        <Share className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </>
    );
}
