"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { GroupDTO } from "@/types/models/group";
import { UserRoundMinus } from "lucide-react";

function formatLastOnline(iso?: string): string {
    if (!iso) return "never";
    const ms = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

export function GroupMembersCard({
    members,
    currentUserId,
    userIsAdmin,
    onKickMember,
}: {
    members: GroupDTO["members"];
    currentUserId: string;
    userIsAdmin: boolean;
    onKickMember: (memberId: string) => void | Promise<void>;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {members.map((member) => (
                    <div
                        key={member.user}
                        className="flex items-center justify-between gap-3 rounded-md p-2 hover:bg-muted/50"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                                {member.avatarUrl && (
                                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                                )}
                                <AvatarFallback>
                                    {(member.name || "?").slice(0, 1).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <div className="font-medium truncate">{member.name || "N/A"}</div>
                                <div className="text-xs text-muted-foreground">
                                    last seen {formatLastOnline(member.lastOnline)}
                                </div>
                            </div>
                        </div>
                        {userIsAdmin && member.user !== currentUserId && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon">
                                        <UserRoundMinus size={18} />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will remove{" "}
                                            {member.name} from the group.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onKickMember(member.user)}
                                            className="bg-destructive"
                                        >
                                            Kick
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
