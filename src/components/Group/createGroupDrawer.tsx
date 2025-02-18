import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { IGroup } from "@/db/models/Group";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { mutate } from "swr";

export function CreateGroupDrawer() {
    const [groupName, setGroupName] = useState("");
    const { toast } = useToast();
    const {user} = useAuthRedirect();

    const createGroup = async () => {
        try {
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: groupName }),
            });

            if (!res.ok) {
                console.error("Failed to create group: ", res);
                toast({ title: "Failed to create group!", variant: "destructive" });
                return;
            }

            mutate(`/api/users/${user._id}/groups`);
        } catch (error) {
            console.error("Failed to create group: ", error);
            toast({ title: "Failed to create group!", variant: "destructive" });
        }
    };

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button className="w-full">Create</Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Create a Group</DrawerTitle>
                </DrawerHeader>
                <div className="mx-auto w-full max-w-sm">
                    <div className="p-4 pb-0">
                        <Input
                            autoFocus
                            id="groupName"
                            placeholder="Group Name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button onClick={createGroup} disabled={!groupName} className="mb-6 w-full h-12 text-lg font-bold">
                                Create
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
