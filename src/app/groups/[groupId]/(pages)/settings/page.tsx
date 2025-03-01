"use client";

import Header from "@/components/ui/custom/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody,  TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { IGroup } from "@/db/models/Group";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DoorOpen, UserRoundMinus } from "lucide-react";
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
import BackLink from "@/components/ui/custom/BackLink";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";

interface IGroupProcessed extends IGroup {
  userIsAdmin: boolean;
}

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuthRedirect();
  const { toast } = useToast();
  const [settings, setSettings] = useState<any>({});
  const [deleteInput, setDeleteInput] = useState("");
  const [memberToKick, setMemberToKick] = useState<string | null>(null);
  const router = useRouter();

  const { data: group, isLoading, error, mutate } = useSWR<IGroupProcessed>(`/api/groups/${groupId}`, fetcher, {});

  useEffect(() => {
    if (group) {
      setSettings({
        questionCount: group.questionCount,
        rallyCount: group.rallyCount,
        rallyGapDays: group.rallyGapDays,
      });
    }
  }, [group]);

  if (error) return <p className="text-red-500">Failed to load group data</p>;

  const userIsAdmin =
    group && group.userIsAdmin

  const adminName = group?.admin
    ? group.members.find((member) => member.user.toString() === group.admin.toString())?.name || "N/A"
    : "N/A";

  const currentMember = group?.members.find(
    (member) => member.user.toString() === user?._id.toString()
  );
  const currentMemberName = currentMember?.name || "Member not found";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({ ...prev, [name]: Number(value) }));
  };

  const saveSettings = async () => {
    try {
      await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast({ title: "Group Settings saved" });
      mutate(); // Revalidate group data after saving settings
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({ title: "Failed to save Settings", variant: "destructive" });
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
      toast({ title: "Member kicked" });
      mutate(); // Revalidate group data after kicking a member
    } catch (error) {
      console.error("Failed to kick member:", error);
    } finally {
      setMemberToKick(null);
    }
  };

  const leaveGroup = async () => {
    try {
      await fetch(`/api/groups/${groupId}/members/${user._id}`, { method: "DELETE" });
      toast({ title: "You have left the group" });
      router.push("/groups");
    } catch (error) {
      console.error("Failed to leave group:", error);
      toast({ title: "Failed to leave group", variant: "destructive" });
    }
  };

  const deleteGroup = async () => {
    if (!userIsAdmin || deleteInput !== group?.name) return;
    try {
      await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      toast({ title: "Group deleted successfully" });
      router.push("/groups");
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast({ title: "Failed to delete group", variant: "destructive" });
    }
  };

  return (
    <>
      <Suspense fallback={<Skeleton className="h-8 w-40 mx-auto mb-4" />}>
        <Header title={group?.name || null} />
      </Suspense>

      {isLoading || !user ? (
          [...Array(10)].map((_, i) => (
              <Skeleton className="h-12 mb-4 mt" key={i}/>
          ))        
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
                      pattern="\d*"
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
                      pattern="\d*"
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
                      pattern="\d*"
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
                  {group.admin ? `${adminName}` : "N/A"}
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
                {userIsAdmin && <TableHead className="text-right">Remove</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.members.map((member) => (
                <TableRow key={member.user.toString()}>
                  <TableCell className="font-medium">{member.name || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    {/* {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "N/A"} */}
                    N/A
                  </TableCell>
                  {userIsAdmin && member.user !== user._id && (
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            onClick={() => confirmKickMember(member.user.toString())}
                          >
                            <UserRoundMinus size={20} />
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <span>Leave Group</span>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. You will lose access to this group.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={leaveGroup} className="bg-destructive">Leave</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Button>

          {userIsAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full my-10">
                  Delete Group
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this group?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action is permanent and cannot be undone. Type <strong>{group.name}</strong> to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  placeholder="Type group name"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="my-2"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteInput !== group.name}
                    onClick={deleteGroup}
                    className="bg-destructive"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </>
      ) : (
        <p>Group not found.</p>
      )}
    </>
  );
}
