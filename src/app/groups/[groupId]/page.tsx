"use client";

import Header from "@/components/ui/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { IGroup } from "@/db/models/Group";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DoorOpen } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { session, status, user } = useAuthRedirect();
  const [group, setGroup] = useState<IGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});
  const { toast } = useToast();
  const [memberToKick, setMemberToKick] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/groups/${groupId}`);
        const data = await response.json();
        setGroup(data);
        setSettings({
          questionCount: data.questionCount,
          rallyCount: data.rallyCount,
          rallyGapDays: data.rallyGapDays,
        });
      } catch (error) {
        console.error("Failed to fetch group data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId]);

  const userIsAdmin = 
    !loading && 
    group?.admin && 
    user?._id && 
    group.admin.toString() === user._id.toString();

  // Find the current user's entry in group members based on user._id
  const currentMember = group?.members.find((member) => member.user.toString() === user?._id.toString());
  const currentMemberName = currentMember?.name || "Member not found";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev:any) => ({ ...prev, [name]: Number(value) }));
  };

  const saveSettings = async () => {
    try {
      await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast({title: "Group Settings saved"});
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({title: "Failed to save Settings", variant: "destructive",});
    }
  };

  const confirmKickMember = (memberId: string) => {
    setMemberToKick(memberId);
  };

  const kickMember = async () => {
    if (!memberToKick) return;

    try {
      await fetch(`/api/groups/${groupId}/members/${memberToKick}`, {
        method: "DELETE",
      });
      setGroup((prevGroup:any) => ({
        ...prevGroup,
        members: prevGroup?.members.filter((member:any) => member.user.toString() !== memberToKick),
      }));
      toast({title: "Member kicked"});
    } catch (error) {
      console.error("Failed to kick member:", error);
    } finally {
      setMemberToKick(null);  // Reset the member to kick after the action
    }
  };

  return (
    <>
      <Suspense fallback={<Skeleton className="h-8 w-40 mx-auto mb-4" />}>
        <Header href={`/groups/${groupId}/dashboard`} title={group?.name || null} />
      </Suspense>

      {loading ? (
        <div>
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : group ? (
        <>
          <Table className="mb-6">
            <TableBody>
              <TableRow>
                <TableCell>Your Name in this group</TableCell>
                <TableCell className="text-right">{currentMemberName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Group ID</TableCell>
                <TableCell className="text-right">{groupId}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Question Count</TableCell>
                <TableCell className="flex justify-end text-right">
                  {userIsAdmin ? (
                    <Input
                      type="number"
                      name="questionCount"
                      value={settings.questionCount}
                      onChange={handleInputChange}
                      className="w-11 text-center"
                    />
                  ) : (
                    group.questionCount
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Last Question Date</TableCell>
                <TableCell className="text-right">
                  {group.lastQuestionDate ? new Date(group.lastQuestionDate).toLocaleDateString() : "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Rally Count</TableCell>
                <TableCell className="flex justify-end text-right">
                  {userIsAdmin ? (
                    <Input
                      type="number"
                      name="rallyCount"
                      value={settings.rallyCount}
                      onChange={handleInputChange}
                      className="w-11 text-center"
                    />
                  ) : (
                    group.rallyCount
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Rally Gap Days</TableCell>
                <TableCell className="flex justify-end text-right">
                  {userIsAdmin ? (
                    <Input
                      type="number"
                      name="rallyGapDays"
                      value={settings.rallyGapDays}
                      onChange={handleInputChange}
                      className="w-11 text-center"
                    />
                  ) : (
                    group.rallyGapDays
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Created At</TableCell>
                <TableCell className="text-right">
                  {new Date(group.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Admin</TableCell>
                <TableCell className="text-right">
                  {group.admin ? `${group.admin}` : "N/A"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {userIsAdmin && (
            <Button className="mt-4 w-full" onClick={saveSettings}>
              Save Settings
            </Button>
          )}

          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Name</TableHead>
                <TableHead className="text-right">Joined At</TableHead>
                {userIsAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.members.map((member) => (
                <TableRow key={member.user.toString()}>
                  <TableCell className="font-medium">{member.name || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  {userIsAdmin && member.user !== user._id && (
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            onClick={() => confirmKickMember(member.user.toString())}
                          >
                            Kick
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will remove {member.name} from the group.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={kickMember} className="bg-destructive" >Kick</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="destructive" className="my-6 w-full">
            <DoorOpen />
            Leave Group
            </Button>
        </>
      ) : (
        <p>Group not found.</p>
      )}
    </>
  );
}
