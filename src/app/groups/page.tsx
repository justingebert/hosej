"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowDown, CircleHelp, Copy, Star, User, Users } from "lucide-react";
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

    return (
        <>
            {isLoading || !user ? (
                <GroupListSkeleton />
            ) : groups.length === 0 ? (
                <EmptyGroupsGuide />
            ) : (
                <div className="flex-grow overflow-y-auto py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
                        {groups.map((group) => (
                            <Card
                                key={group._id}
                                className="cursor-pointer"
                                onClick={() => {
                                    play("navigation");
                                    router.push(`/groups/${group._id}/dashboard`);
                                }}
                            >
                                <CardContent className="flex justify-between items-center p-4">
                                    <div>
                                        <CardTitle>{group.name}</CardTitle>
                                        <CardDescription>Go Vote Now!</CardDescription>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleStar(group._id, e)}
                                        >
                                            <Star
                                                className="w-4 h-4"
                                                color={
                                                    starredGroupId === group._id ? "gold" : "gray"
                                                }
                                            />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyFn(`${group._id}`);
                                            }}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

function GroupListSkeleton() {
    return (
        <div className="flex-grow overflow-y-auto py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="cursor-pointer">
                        <CardContent className="flex justify-between items-center p-4">
                            <div>
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-24 mt-1" />
                            </div>
                            <Skeleton className="h-8 w-8" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function GroupsHeader({ router }: { router: ReturnType<typeof useRouter> }) {
    return (
        <div className="flex justify-between items-center w-full">
            <Button
                variant="outline"
                size="icon"
                haptic="navigation"
                onClick={() => router.push(`/help`)}
            >
                <CircleHelp />
            </Button>
            <h1 className="text-4xl font-bold">Groups</h1>
            <Button
                variant="outline"
                size="icon"
                haptic="navigation"
                onClick={() => router.push(`/settings`)}
            >
                <User />
            </Button>
        </div>
    );
}

function EmptyGroupsGuide() {
    return (
        <div className="flex-grow flex flex-col items-center justify-center pb-32 px-6">
            <div className="flex flex-col items-center space-y-4 text-muted-foreground/50">
                <Users className="w-16 h-16" />
                <h2 className="text-2xl font-semibold text-muted-foreground/60">No groups yet</h2>
                <p className="text-center text-sm text-muted-foreground/40 max-w-xs">
                    Get started by creating your own group or joining an existing one with a group
                    ID
                </p>
            </div>

            <div className="mt-12 w-full max-w-sm">
                <Card className="border-dashed border-muted-foreground/20 bg-muted/30">
                    <CardContent className="flex justify-between items-center p-4">
                        <div>
                            <CardTitle className="text-muted-foreground/30">My Group</CardTitle>
                            <CardDescription className="text-muted-foreground/20">
                                Go Vote Now!
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" disabled className="opacity-30">
                                <Star className="w-4 h-4" />
                            </Button>
                            <div className="relative">
                                <Button variant="ghost" size="icon" disabled className="opacity-30">
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <span className="text-xs text-muted-foreground/40 whitespace-nowrap">
                                        Share ID
                                    </span>
                                    <ArrowDown className="w-5 h-5 text-muted-foreground/30 -mt-0.5" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-16 flex w-full max-w-sm justify-between px-4">
                <div className="flex flex-col items-center space-y-1">
                    <span className="text-xs text-muted-foreground/40">Start fresh</span>
                    <ArrowDown className="w-6 h-6 text-muted-foreground/30 animate-bounce" />
                </div>
                <div className="flex flex-col items-center space-y-1">
                    <span className="text-xs text-muted-foreground/40">Have a code?</span>
                    <ArrowDown className="w-6 h-6 text-muted-foreground/30 animate-bounce" />
                </div>
            </div>
        </div>
    );
}
