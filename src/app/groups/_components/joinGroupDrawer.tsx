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
    const [code, setCode] = useState("");
    const { toast } = useToast();
    const { user } = useAuthRedirect();

    // Accept a bare invite code or a full /join/<code> link.
    const extractInviteCode = (input: string): string => {
        const trimmed = input.trim();
        const match = trimmed.match(/\/join\/([^\s/?#]+)/);
        if (match) return match[1];
        return trimmed;
    };

    const handleJoin = async () => {
        if (code.trim() === "") return;
        const parsedCode = extractInviteCode(code);
        try {
            const res = await fetch(`/api/invites/${parsedCode}`, {
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
        } catch (error: unknown) {
            console.error("Failed to join group: ", error);
            toast({ title: "Failed to join group!", variant: "destructive" });
        } finally {
            setCode("");
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
                            id="inviteCode"
                            placeholder="Invite code or link"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button
                                onClick={handleJoin}
                                disabled={!code}
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
