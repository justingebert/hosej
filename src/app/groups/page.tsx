"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { IGroup } from "@/db/models/Group";
import { Copy } from "lucide-react";
import { useSession, signIn } from "next-auth/react";

function CreateGroupDrawer({ onCreate }: { onCreate: (groupName: string) => void }) {
  const [groupName, setGroupName] = useState("");

  const handleCreate = () => {
    if (groupName.trim() === "") return;
    onCreate(groupName);
    setGroupName("");
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div className="flex justify-center">
          <Button>Create Group</Button>
        </div>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">

          <div className="p-4 pb-0">
            <div className="flex flex-col space-y-1.5">
              <Input
                id="groupName"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button onClick={handleCreate}>Create</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const [groups, setGroups] = useState<IGroup[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      if (status === "loading") return; // Do nothing while loading
      if (!session) signIn();

      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: session!.user }),
      });

      if (res.ok) {
        const groupsData = await res.json();
        setGroups(groupsData);
      } else {
        console.error('Failed to fetch groups');
      }
      console.log("User", session!.user)
    };

    fetchGroups();
  }, [session]);

  const createGroup = async (groupName: string) => {
    const res = await fetch('/api/groups/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, user: session!.user }),
    });

    if (res.ok) {
      const newGroup = await res.json();
      setGroups((prevGroups) => [...prevGroups, newGroup]);
    } else {
      console.error('Failed to create group');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Link copied to clipboard!");
    }).catch((err) => {
      console.error("Failed to copy: ", err);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {groups.map((group) => (
          <Card
            key={group._id}
            className="cursor-pointer"
            onClick={() => router.push(`/groups/${group._id}/dashboard`)}
          >
            <CardContent className="flex justify-between items-center p-4">
              <div>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>Go Vote Now!</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(`${window.location.origin}/join/${group._id}`);
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <CreateGroupDrawer onCreate={createGroup} />
    </div>
  );
}
