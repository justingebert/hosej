"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, CircleHelp } from 'lucide-react';
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
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { motion } from 'framer-motion';

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
          <Button >Create Group</Button>
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
              <Button onClick={handleCreate} disabled={!groupName}>Create</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function GroupsPage() {
  const { session, status, user } = useAuthRedirect();
  const [groups, setGroups] = useState<IGroup[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      if (status === "loading") return; // Do nothing while loading

      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user }),
      });

      if (res.ok) {
        const groupsData = await res.json();
        setGroups(groupsData);
      } else {
        console.error('Failed to fetch groups');
      }
    };

    fetchGroups();
  }, [session, status, user]);

  const createGroup = async (groupName: string) => {
    const res = await fetch('/api/groups/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, user: user }),
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


  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.h1
          className="text-4xl font-bold text-center relative"
          style={{
            backgroundImage: "linear-gradient(90deg, var(--shine-color) 0%, var(--shine-highlight) 50%, var(--shine-color) 100%)",
            backgroundSize: "200% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
          animate={{
            backgroundPosition: ["-100% 0", "100% 0"],
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          HoseJ
        </motion.h1>
      </div>
    );
  }
  

  return (
    <div className="relative min-h-screen flex flex-col">
    {/* Header */}
    <div className="flex justify-between items-center w-full">
      <Button variant="outline" size="icon" onClick={() => { router.push(`/help`)}}>
        <CircleHelp/>
      </Button>
      <h1 className="text-4xl font-bold">HoseJ</h1>
      <Button variant="outline" size="icon" onClick={() => { router.push(`/settings`)}}>
        <Settings/>
      </Button>
    </div>

    {/* Group List */}
    <div className="flex-grow overflow-y-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
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
    </div>

    {/* Create Group Button - Fixed at Bottom */}
    <div className="fixed bottom-0 left-0 w-full backdrop-blur-sm p-8">
      <CreateGroupDrawer onCreate={createGroup} />
    </div>
  </div>
  );
}
