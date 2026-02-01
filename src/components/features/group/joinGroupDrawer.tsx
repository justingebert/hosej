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
import { mutate } from "swr";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JoinGroupDrawer() {
    const [groupId, setGroupId] = useState("");
    const { toast } = useToast();
    const { user } = useAuthRedirect();

    const handleJoin = async () => {
        if (groupId.trim() === "") return;
        try {
            const res = await fetch(`/api/groups/${groupId}/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const response = await res.json();
                toast({ title: "Error", description: response.message, variant: "destructive" });
                return;
            }

            mutate(user ? `/api/groups` : null);
        } catch (error: any) {
            console.error("Failed to join group: ", error);
            toast({ title: "Failed to join group!", variant: "destructive" });
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
                            placeholder="Group ID"
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
