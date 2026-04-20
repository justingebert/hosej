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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { GroupLanguage } from "@/types/models/group";

export function CreateGroupDrawer() {
    const [groupName, setGroupName] = useState("");
    const [language, setLanguage] = useState<GroupLanguage>("de");
    const { toast } = useToast();

    const createGroup = async () => {
        try {
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: groupName, language }),
            });

            if (!res.ok) {
                toast({ title: "Failed to create group!", variant: "destructive" });
                return;
            }

            mutate(`/api/groups`);
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
                    <div className="p-4 pb-0 space-y-4">
                        <Input
                            autoFocus
                            id="groupName"
                            placeholder="Group Name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <div className="space-y-2">
                            <Label htmlFor="language">Question Language</Label>
                            <Select
                                value={language}
                                onValueChange={(value) => setLanguage(value as GroupLanguage)}
                            >
                                <SelectTrigger id="language">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="de">Deutsch</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button
                                onClick={createGroup}
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
