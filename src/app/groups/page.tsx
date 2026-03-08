"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowDown, CircleHelp, Copy, Share, Star, User, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import type { GroupDTO } from "@/types/models/group";
import { JoinGroupDrawer } from "@/components/features/group/joinGroupDrawer";
import { CreateGroupDrawer } from "@/components/features/group/createGroupDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import type { Session } from "next-auth";
import { useEffect, useState } from "react";
import { useAppHaptics } from "@/hooks/useAppHaptics";
import { Badge } from "@/components/ui/badge";

export default function GroupsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuthRedirect();

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

    return (
        <div className="relative min-h-screen flex flex-col">
            <GroupsHeader router={router} />

            <GroupsList router={router} copyFn={copyToClipboard} user={user} />

            <div className="fixed bottom-0 left-0 w-full backdrop-blur-sm p-8 flex space-x-4">
                <div className="w-1/2">
                    <CreateGroupDrawer />
                </div>
                <div className="w-1/2">
                    <JoinGroupDrawer />
                </div>
            </div>
        </div>
    );
}

function GroupsList({
    router,
    copyFn,
    user,
}: {
    router: ReturnType<typeof useRouter>;
    copyFn: (text: string) => void;
    user?: Session["user"];
}) {
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
                                                    copyFn(`${group._id}`);
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

function GroupListSkeleton() {
    return (
        <div className="flex-grow overflow-y-auto py-6 max-w-5xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-24">
                {[...Array(6)].map((_, i) => (
                    <Card
                        key={i}
                        className="cursor-pointer bg-gradient-to-br from-background to-muted/50 border shadow-sm rounded-2xl overflow-hidden"
                    >
                        <CardContent className="flex justify-between items-center p-5">
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-6 w-32 rounded-md" />
                                <Skeleton className="h-4 w-24 rounded-md" />
                            </div>
                            <div className="flex space-x-2">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <Skeleton className="h-9 w-9 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function GroupsHeader({ router }: { router: ReturnType<typeof useRouter> }) {
    return (
        <div className="flex justify-between items-center w-full shrink-0">
            <Button
                variant="ghost"
                className="rounded-full bg-muted/50 hover:bg-muted"
                size="icon"
                haptic="navigation"
                onClick={() => router.push(`/help`)}
            >
                <CircleHelp className="h-5 w-5" />
            </Button>
            <h1 className="text-4xl font-bold tracking-tight px-4">Groups</h1>
            <Button
                variant="ghost"
                className="rounded-full bg-muted/50 hover:bg-muted"
                size="icon"
                haptic="navigation"
                onClick={() => router.push(`/settings`)}
            >
                <User className="h-5 w-5" />
            </Button>
        </div>
    );
}

function EmptyGroupsGuide() {
    return (
        <div className="flex-grow flex flex-col items-center justify-center pb-32 px-6">
            <div className="flex flex-col items-center space-y-4 text-muted-foreground/50">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                    <Users className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-muted-foreground/60">
                    No groups yet
                </h2>
                <p className="text-center text-sm text-muted-foreground/40 max-w-xs leading-relaxed">
                    Get started by creating your own group or joining an existing one with a group
                    ID
                </p>
            </div>

            <div className="mt-12 w-full max-w-xs relative group">
                <Card className="border-dashed border-2 border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30 shadow-sm rounded-2xl">
                    <CardContent className="flex justify-between items-center p-5">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-muted-foreground/40 text-xl tracking-tight">
                                My Group
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/30 text-sm">
                                Go Vote Now!
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled
                                className="opacity-30 rounded-full"
                            >
                                <Star className="w-5 h-5" />
                            </Button>
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled
                                    className="opacity-30 rounded-full"
                                >
                                    <Share className="w-4 h-4" />
                                </Button>
                                <div className="absolute -top-10 -left-1/4 -translate-x-1/2 flex flex-col items-center animate-bounce">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/60 whitespace-nowrap bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                                        Share ID
                                    </span>
                                    <ArrowDown className="w-4 h-4 text-primary/40 -mt-1" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-16 flex w-full max-w-sm justify-between px-8 relative">
                <div className="flex flex-col items-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Start fresh
                    </span>
                    <ArrowDown className="w-5 h-5 text-muted-foreground animate-bounce" />
                </div>
                <div className="flex flex-col items-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Have a code?
                    </span>
                    <ArrowDown className="w-5 h-5 text-muted-foreground animate-bounce" />
                </div>
            </div>
        </div>
    );
}
