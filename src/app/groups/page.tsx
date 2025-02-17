"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CircleHelp, Copy, Star, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { IGroup } from "@/db/models/Group";
import { JoinGroupDrawer } from "@/components/Group/joinGroupDrawer";
import { CreateGroupDrawer } from "../../components/Group/createGroupDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR, { mutate } from "swr";
import fetcher from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { IUser } from "@/db/models/user";
import { useEffect, useState } from "react";

export default function GroupsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const {user} = useAuthRedirect();

    function copyToClipboard(text: string) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                toast({ title: "GroupId copied to clipboard!" });
            })
            .catch((err) => {
                console.error("Failed to copy to clipboard: ", err);
                toast({ title: "Ooops someting went wrong while coping!", variant: "destructive" });
            });
    }

    return (
        <div className="relative min-h-screen flex flex-col">
            <Header router={router} />

            <GroupsList router={router} copyFn={copyToClipboard} user={user}/>

            <div className="fixed bottom-0 left-0 w-full backdrop-blur-sm p-8 flex space-x-4">
              <div className="w-1/2">
                  <CreateGroupDrawer />
              </div>
              <div className="w-1/2">
                  <JoinGroupDrawer/>
              </div>
          </div>
        </div>
    );
}

function GroupsList({router,copyFn,user}: {router: ReturnType<typeof useRouter>; copyFn: (text: string) => void; user: IUser}) {
  
  const [starredGroupId, setStarredGroupId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("starredGroupId");
    if (stored) {
      setStarredGroupId(stored);
    }
  }, []);

  const handleStar = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (starredGroupId === groupId) {
      localStorage.removeItem("starredGroupId");
      setStarredGroupId(null);
    } else {
      localStorage.setItem("starredGroupId", groupId);
      setStarredGroupId(groupId);
    }
  };
  
  const { data, isLoading } = useSWR<{ groups: IGroup[] }>(user ? `/api/users/${user._id}/groups` : null, fetcher);
    const groups = data?.groups || [];

    return (
        <>
            {(isLoading || !user )? (
                <GroupListSkeleton />
            ) : (
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
                                  <div className="flex items-center space-x-2">
                
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => handleStar(group._id, e)}
                                    >
                                      <Star
                                        className="w-4 h-4"
                                        color={starredGroupId === group._id ? "gold" : "gray"}
                                      />
                                    </Button>

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
                                  </div>
                              </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
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
            <h1 className="text-4xl font-bold">Groups</h1>
            <Button variant="outline" size="icon" onClick={() => router.push(`/settings`)}>
                <User />
            </Button>
        </div>
    );
}