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
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
  
export function CreateGroupDrawer({ onCreate }: { onCreate: (groupName: string) => void }) {
    const [groupName, setGroupName] = useState("");
  
    const handleCreate = () => {
      if (groupName.trim() === "") return;
      onCreate(groupName);
      setGroupName("");
    };
  
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button className="w-full">Create</Button>
        </DrawerTrigger>
        <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Create a Group
          </DrawerTitle>
        </DrawerHeader>
          <div className="mx-auto w-full max-w-sm">
            <div className="p-4 pb-0">
              <Input
                id="groupName"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button onClick={handleCreate} disabled={!groupName} className="mb-6">Create</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  
export function JoinGroupDrawer() {
    const router = useRouter();
    const [groupId, setGroupId] = useState("");
  
    const handleJoin = () => {
      if (groupId.trim() === "") return;
      router.push(`/join/${groupId}`);
    };
  
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button className="w-full">Join</Button>
        </DrawerTrigger>
        <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Join a Group
          </DrawerTitle>
        </DrawerHeader>
          <div className="mx-auto w-full max-w-sm">
            <div className="p-4 pb-0">
              <Input
                id="groupId"
                placeholder="Group ID"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              />
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button onClick={handleJoin} disabled={!groupId} className="mb-6">Join</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }