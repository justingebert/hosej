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
import { Input } from "@/components/ui/input";
import { DoorOpen, Trash } from "lucide-react";
import { useState } from "react";

export function GroupDangerZoneCard({
    groupName,
    userIsAdmin,
    onLeaveGroup,
    onDeleteGroup,
}: {
    groupName: string;
    userIsAdmin: boolean;
    onLeaveGroup: () => void | Promise<void>;
    onDeleteGroup: () => void | Promise<void>;
}) {
    const [deleteInput, setDeleteInput] = useState("");

    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                            <DoorOpen />
                            <span>Leave Group</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. You will lose access to this group.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onLeaveGroup} className="bg-destructive">
                                Leave
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {userIsAdmin && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                                <Trash />
                                <span>Delete Group</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you sure you want to delete this group?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action is permanent and cannot be undone. Type{" "}
                                    <strong>{groupName}</strong> to confirm.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <Input
                                placeholder="Type group name"
                                value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}
                                className="my-2"
                            />
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={deleteInput !== groupName}
                                    onClick={onDeleteGroup}
                                    className="bg-destructive"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardContent>
        </Card>
    );
}
