"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings, CircleHelp, Copy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { IGroup } from "@/db/models/Group";
import { CreateGroupDrawer, JoinGroupDrawer } from "@/components/Group/groupdrawers";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR, { mutate } from "swr";
import fetcher from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";

export default function GroupsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const createGroup = async (groupName: string) => {
    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName }),
      });

      if (res.ok) {
        const newGroup = await res.json();
        mutate("/api/users/groups", (data) => ({ groups: [...data.groups, newGroup] }), false);
      } else {
        console.error("Failed to create group");
        toast({ title: "Failed to create group!", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to create group: ", error);
      toast({ title: "Failed to create group!", variant: "destructive" });
    }
  };

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast({title: "Link copied to clipboard!"});
    }).catch((err) => {
      console.error("Failed to copy: ", err);
    });
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header router={router} />
      <GroupsList router={router} copyFn={copyToClipboard}/>
      <Footer createGroup={createGroup} />
    </div>
  );
}

function GroupsList({ router, copyFn }: { router: ReturnType<typeof useRouter>, copyFn: (text: string) => void }) {
  const { data, isLoading } = useSWR<{ groups: IGroup[] }>("/api/users/groups", fetcher, { });
  const groups = data?.groups || [];

  return (
    <>
    {isLoading ? <GroupListSkeleton/>: 
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
                  copyFn(`${group._id}`);
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    }
    </>
  );
}

function GroupListSkeleton() {
  return (
    <div className="flex-grow overflow-y-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="cursor-pointer">
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
              <Skeleton className="h-8 w-8" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Header({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="flex justify-between items-center w-full">
      <Button variant="outline" size="icon" onClick={() => router.push(`/help`)}>
        <CircleHelp />
      </Button>
      <h1 className="text-4xl font-bold">HoseJ</h1>
      <Button variant="outline" size="icon" onClick={() => router.push(`/settings`)}>
        <Settings />
      </Button>
    </div>
  );
}

function Footer({ createGroup }: { createGroup: (groupName: string) => Promise<void> }) {
  return (
    <div className="fixed bottom-0 left-0 w-full backdrop-blur-sm p-8 flex space-x-4">
      <div className="w-1/2">
        <CreateGroupDrawer onCreate={createGroup} />
      </div>
      <div className="w-1/2">
        <JoinGroupDrawer />
      </div>
    </div>
  );
}
