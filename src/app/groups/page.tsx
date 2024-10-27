"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings, CircleHelp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

import { IGroup } from "@/db/models/Group";
import { Copy } from "lucide-react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { motion } from 'framer-motion';
import { CreateGroupDrawer, JoinGroupDrawer } from "@/components/Group/groupdrawers";


export default function GroupsPage() {
  const { session, status, user } = useAuthRedirect();
  const [groups, setGroups] = useState<IGroup[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      if (status === "loading") return; // Do nothing while loading

      const res = await fetch('/api/users/groups', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        //body: JSON.stringify({ user: user }),
      });

      if (res.ok) {
        const groupsData = await res.json();
        setGroups(groupsData.groups);
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
      body: JSON.stringify({ name: groupName}),
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
                  copyToClipboard(`${group._id}`);
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    <div className="fixed bottom-0 left-0 w-full backdrop-blur-sm p-8 flex space-x-4">
        <div className="w-1/2">
          <CreateGroupDrawer onCreate={createGroup} />
        </div>
        <div className="w-1/2">
          <JoinGroupDrawer />
        </div>
      </div>
    </div>
  );
}
