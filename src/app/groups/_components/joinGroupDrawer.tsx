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

export function JoinGroupDrawer() {
    const [groupId, setGroupId] = useState("");
    const { toast } = useToast();
    const { joinGroup } = useGroups(false);

    const extractGroupId = (input: string): string => {
        const trimmed = input.trim();
        const match = trimmed.match(/\/join\/([^\s/?#]+)/);
        if (match) return match[1];
        return trimmed;
    };

    const handleJoin = async () => {
        if (groupId.trim() === "") return;
        const parsedId = extractGroupId(groupId);
        try {
            await joinGroup(parsedId);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to join group";
            console.error("Failed to join group: ", error);
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setGroupId("");
        }
    };

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button className="w-full">Join</Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Join a Group</DrawerTitle>
                </DrawerHeader>
                <div className="mx-auto w-full max-w-sm">
                    <div className="p-4 pb-0">
                        <Input
                            autoFocus
                            id="groupId"
                            placeholder="Group ID or invite link"
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                        />
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button
                                onClick={handleJoin}
                                disabled={!groupId}
                                className="mb-6 w-full h-12 text-lg font-bold"
                            >
                                Join
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
