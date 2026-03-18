"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { GroupDTO } from "@/types/models/group";
import { UserRoundMinus } from "lucide-react";

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
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Name</TableHead>
                            <TableHead className="text-right">Joined At</TableHead>
                            {userIsAdmin && <TableHead className="text-right">Remove</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => (
                            <TableRow key={member.user}>
                                <TableCell className="font-medium">
                                    {member.name || "N/A"}
                                </TableCell>
                                <TableCell className="text-right">
                                    {member.joinedAt
                                        ? new Date(member.joinedAt).toLocaleDateString()
                                        : "N/A"}
                                </TableCell>
                                {userIsAdmin && member.user !== currentUserId && (
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive">
                                                    <UserRoundMinus size={20} />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Are you sure?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will
                                                        remove {member.name} from the group.
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
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
