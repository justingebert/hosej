import type { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { useAppHaptics } from "@/hooks/useAppHaptics";
import { useEffect, useState } from "react";
import useSWR from "swr";
import type { GroupDTO } from "@/types/models/group";
import fetcher from "@/lib/fetcher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmptyGroupsGuide } from "@/app/groups/_components/emptyGroupsGuide";
import { GroupListSkeleton } from "@/app/groups/_components/groupListSkeleton";

export function GroupsList({
    router,
    user,
}: {
    router: ReturnType<typeof useRouter>;
    user?: Session["user"];
}) {
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

    const handleStar = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (starredGroupId === groupId) {
            localStorage.removeItem("starredGroupId");
            setStarredGroupId(null);
        } else {
            localStorage.setItem("starredGroupId", groupId);
            setStarredGroupId(groupId);
        }
    };

    function copyToClipboard(text: string) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                toast({ title: "GroupId copied to clipboard!" });
            })
            .catch((err) => {
                console.error("Failed to copy to clipboard: ", err);
                toast({ title: "Ooops someting went wrong while coping!", variant: "destructive" });
            });
    }

    const { data, isLoading } = useSWR<{ groups: GroupDTO[] }>(
        user ? `/api/groups` : null,
        fetcher
    );
    const groups = data?.groups || [];

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
                <div className="flex-grow py-6 max-w-5xl mx-auto w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {groups.map((group) => (
                            <div key={group._id} className="relative group">
                                {groupsActivity?.[group._id] && (
                                    <Badge className="absolute -top-1.5 -right-1.5 z-10 h-4 w-4 rounded-full bg-destructive animate-pulse shadow-sm shadow-destructive/20 border-border" />
                                )}
                                <Card
                                    className="cursor-pointer bg-gradient-to-br from-background to-muted/50 border shadow-sm hover:shadow-md active:scale-[0.98] transition-all overflow-hidden rounded-2xl"
                                    onClick={() => {
                                        play("navigation");
                                        router.push(`/groups/${group._id}/dashboard`);
                                    }}
                                >
                                    <CardContent className="flex justify-between items-center p-5">
                                        <div className="flex flex-col gap-1">
                                            <CardTitle className="tracking-tight text-xl">
                                                {group.name}
                                            </CardTitle>
                                            <CardDescription className="text-sm">
                                                Go Vote Now!
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-full hover:bg-primary/10 transition-colors"
                                                onClick={(e) => handleStar(group._id, e)}
                                            >
                                                <Star
                                                    className="w-5 h-5 transition-all"
                                                    fill={
                                                        starredGroupId === group._id
                                                            ? "currentColor"
                                                            : "none"
                                                    }
                                                    color={
                                                        starredGroupId === group._id
                                                            ? "gold"
                                                            : "currentColor"
                                                    }
                                                />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-full hover:bg-primary/10 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyToClipboard(`${group._id}`);
                                                }}
                                            >
                                                <Share className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
