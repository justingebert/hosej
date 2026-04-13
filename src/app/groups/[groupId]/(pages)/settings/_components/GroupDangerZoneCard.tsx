"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ResponsiveConfirm from "@/components/common/ResponsiveConfirm";
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
                <ResponsiveConfirm
                    trigger={
                        <Button variant="destructive" className="w-full">
                            <DoorOpen />
                            <span>Leave Group</span>
                        </Button>
                    }
                    title="Are you sure you want to leave?"
                    description="This action cannot be undone. You will lose access to this group."
                    confirmLabel="Leave"
                    onConfirm={onLeaveGroup}
                />

                {userIsAdmin && (
                    <ResponsiveConfirm
                        trigger={
                            <Button variant="destructive" className="w-full">
                                <Trash />
                                <span>Delete Group</span>
                            </Button>
                        }
                        title="Are you sure you want to delete this group?"
                        description={
                            <>
                                This action is permanent and cannot be undone. Type{" "}
                                <strong>{groupName}</strong> to confirm.
                            </>
                        }
                        confirmLabel="Delete"
                        confirmDisabled={deleteInput !== groupName}
                        onConfirm={onDeleteGroup}
                        onOpenChange={(open) => {
                            if (!open) setDeleteInput("");
                        }}
                    >
                        <Input
                            placeholder="Type group name"
                            value={deleteInput}
                            onChange={(e) => setDeleteInput(e.target.value)}
                            className="mx-4 mb-1 sm:mx-0 sm:mb-0"
                        />
                    </ResponsiveConfirm>
                )}
            </CardContent>
        </Card>
    );
}
