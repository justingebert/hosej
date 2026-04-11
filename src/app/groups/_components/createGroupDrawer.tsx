import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGroups } from "@/hooks/data/useGroups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateGroupDrawer() {
    const [groupName, setGroupName] = useState("");
    const { toast } = useToast();
    const { createGroup } = useGroups(false);

    const handleCreate = async () => {
        try {
            await createGroup(groupName);
            toast({ title: "GroupId Copied to Clipboard!" });
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
                            <Button
                                onClick={handleCreate}
                                disabled={!groupName}
                                className="mb-6 w-full h-12 text-lg font-bold"
                            >
                                Create
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
