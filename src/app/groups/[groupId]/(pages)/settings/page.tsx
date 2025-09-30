"use client";

import Header from "@/components/ui/custom/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHead,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { GroupDTO } from "@/types/models/group";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DoorOpen, Trash, UserRoundMinus } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import useSWR, { useSWRConfig } from "swr";
import fetcher from "@/lib/fetcher";

interface IGroupProcessed extends GroupDTO {
    userIsAdmin: boolean;
}

interface ISettings {
    questionCount: number;
    rallyCount: number;
    rallyGapDays: number;
    jukeboxSettings?: {
        enabled: boolean;
        concurrent: string[];
        maxConcurrentCount: number;
        activationDays: number[];
    };
}

export default function GroupPage() {
    const params = useParams<{ groupId: string }>();
    const groupId = params? params.groupId : "";
    const { user } = useAuthRedirect();
    const { toast } = useToast();
    const [settings, setSettings] = useState<ISettings | any>({});
    const [deleteInput, setDeleteInput] = useState("");
    const [memberToKick, setMemberToKick] = useState<string | null>(null);
    const [concurrentInput, setConcurrentInput] = useState("");
    const [activationDaysInput, setActivationDaysInput] = useState("");
    const router = useRouter();

    const {
        data: group,
        isLoading,
        error,
        mutate,
    } = useSWR<IGroupProcessed>(`/api/groups/${groupId}`, fetcher, {});

    useEffect(() => {
        if (group) {
            setSettings({
                questionCount: group.questionCount,
                rallyCount: group.rallyCount,
                rallyGapDays: group.rallyGapDays,
                jukeboxSettings: group.jukeboxSettings,
            });
            setConcurrentInput((group.jukeboxSettings.concurrent || []).join(", "));
            setActivationDaysInput((group.jukeboxSettings.activationDays || []).join(", "));
        }
    }, [group]);

    if (error) return <p className="text-red-500">Failed to load group data</p>;

    const userIsAdmin = group && group.userIsAdmin;

    const adminName = group?.admin
        ? group.members.find((member) => member.user.toString() === group.admin.toString())?.name ||
          "N/A"
        : "N/A";

    const currentMember = group?.members.find(
        (member) => member.user.toString() === user?._id.toString()
    );
    const currentMemberName = currentMember?.name || "Member not found";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings((prev: any) => ({ ...prev, [name]: Number(value) }));
    };

    const updateJukebox = (partial: Partial<ISettings["jukeboxSettings"]>) => {
        setSettings((prev: any) => ({
            ...prev,
            jukeboxSettings: {
                ...(prev?.jukeboxSettings || {}),
                ...partial,
            },
        }));
    };

    const saveSettings = async () => {
        try {
            const payload: any = { ...settings };
            if (payload.jukeboxSettings) {
                const parsedConcurrent = (concurrentInput || "")
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter((s: string) => s.length > 0);
                const parsedDays = (activationDaysInput || "")
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter((s: string) => s !== "")
                    .map((n: string) => Number(n))
                    .filter((n: number) => !Number.isNaN(n))
                    .filter((n: number) => n >= 1 && n <= 31);
                payload.jukeboxSettings = {
                    ...payload.jukeboxSettings,
                    concurrent: parsedConcurrent,
                    activationDays: parsedDays,
                };
            }
            await fetch(`/api/groups/${groupId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            toast({ title: "Group Settings saved" });
            mutate();
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
            const response = await fetch(`/api/groups/${groupId}/members/${memberToKick}`, {
                method: "DELETE",
            });
            if(!response.ok){
                throw new Error("Failed to kick member");
            }
            toast({ title: "Member kicked" });
            mutate();
        } catch (error) {
            console.error("Failed to kick member:", error);
            toast({ title: "Failed to kick member", variant: "destructive" });
        } finally {
            setMemberToKick(null);
        }
    };

    const leaveGroup = async () => {
        try {
            const res = await fetch(`/api/groups/${groupId}/members/${user._id}`, { method: "DELETE" });
            if (!res.ok) {
                toast({ title: "Failed to leave group", variant: "destructive" });
            }
            mutate()
            toast({ title: "You have left the group" });
            router.push("/groups");
        } catch (error) {
            console.error("Failed to leave group:", error);
            toast({ title: "Something went wrong", variant: "destructive" });
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

            {isLoading ? (
                [...Array(10)].map((_, i) => <Skeleton className="h-12 mb-4 mt" key={i} />)
            ) : group && user ? (
                <div className="space-y-6 pb-12">
                    {/* Group Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Group Information</CardTitle>
                            <CardDescription>Overview and general settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-sm text-muted-foreground">Your Name in this group</div>
                                <div className="text-right">{currentMemberName}</div>

                                <div className="text-sm text-muted-foreground">Group ID</div>
                                <div className="text-right break-all">{groupId}</div>

                                <div className="text-sm text-muted-foreground">Last Question Date</div>
                                <div className="text-right">
                                    {group.lastQuestionDate ? new Date(group.lastQuestionDate).toLocaleDateString() : "N/A"}
                                </div>

                                <div className="text-sm text-muted-foreground">Created At</div>
                                <div className="text-right">{new Date(group.createdAt).toLocaleDateString()}</div>

                                <div className="text-sm text-muted-foreground">Admin</div>
                                <div className="text-right">{group.admin ? `${adminName}` : "N/A"}</div>
                            </div>

                            <div className="pt-2 space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                    <Label htmlFor="questionCount">Question Count</Label>
                                    {userIsAdmin ? (
                                        <Input
                                            id="questionCount"
                                            type="number"
                                            pattern="\\d*"
                                            name="questionCount"
                                            value={settings.questionCount ?? ""}
                                            onChange={handleInputChange}
                                            className="w-20 text-center"
                                        />
                                    ) : (
                                        <div className="text-right w-20">{group.questionCount}</div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <Label htmlFor="rallyCount">Rally Count</Label>
                                    {userIsAdmin ? (
                                        <Input
                                            id="rallyCount"
                                            type="number"
                                            pattern="\\d*"
                                            name="rallyCount"
                                            value={settings.rallyCount ?? ""}
                                            onChange={handleInputChange}
                                            className="w-20 text-center"
                                        />
                                    ) : (
                                        <div className="text-right w-20">{group.rallyCount}</div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <Label htmlFor="rallyGapDays">Rally Gap Days</Label>
                                    {userIsAdmin ? (
                                        <Input
                                            id="rallyGapDays"
                                            type="number"
                                            pattern="\\d*"
                                            name="rallyGapDays"
                                            value={settings.rallyGapDays ?? ""}
                                            onChange={handleInputChange}
                                            className="w-20 text-center"
                                        />
                                    ) : (
                                        <div className="text-right w-20">{group.rallyGapDays}</div>
                                    )}
                                </div>
                            </div>

                            {/* Jukebox Accordion */}
                            <Accordion type="single" collapsible className="w-full pt-2">
                                <AccordionItem value="jukebox">
                                    <AccordionTrigger>Jukebox Settings</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="jukebox-enabled">Enabled</Label>
                                                    <p className="text-sm text-muted-foreground">Allow jukebox features in this group</p>
                                                </div>
                                                <Switch
                                                    id="jukebox-enabled"
                                                    checked={!!settings.jukeboxSettings?.enabled}
                                                    onCheckedChange={(checked) => updateJukebox({ enabled: checked })}
                                                    disabled={!userIsAdmin}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="jukebox-max-concurrent">Max Concurrent Count</Label>
                                                <Input
                                                    id="jukebox-max-concurrent"
                                                    type="number"
                                                    min={1}
                                                    value={settings.jukeboxSettings?.maxConcurrentCount ?? ""}
                                                    onChange={(e) => updateJukebox({ maxConcurrentCount: Number(e.target.value) || 0 })}
                                                    disabled={!userIsAdmin}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="jukebox-concurrent">Concurrent (comma-separated)</Label>
                                                <Input
                                                    id="jukebox-concurrent"
                                                    type="text"
                                                    placeholder="e.g. Jukebox, AnotherFeature"
                                                    value={concurrentInput}
                                                    onChange={(e) => setConcurrentInput(e.target.value)}
                                                    onBlur={() => {
                                                        const parsed = concurrentInput
                                                            .split(",")
                                                            .map((s) => s.trim())
                                                            .filter((s) => s.length > 0);
                                                        updateJukebox({ concurrent: parsed });
                                                        setConcurrentInput(parsed.join(", "));
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            const parsed = concurrentInput
                                                                .split(",")
                                                                .map((s) => s.trim())
                                                                .filter((s) => s.length > 0);
                                                            updateJukebox({ concurrent: parsed });
                                                            setConcurrentInput(parsed.join(", "));
                                                        }
                                                    }}
                                                    disabled={!userIsAdmin}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="jukebox-activation-days">Activation Days (day of month, comma-separated)</Label>
                                                <Input
                                                    id="jukebox-activation-days"
                                                    type="text"
                                                    placeholder="e.g. 1, 3, 5"
                                                    value={activationDaysInput}
                                                    onChange={(e) => setActivationDaysInput(e.target.value)}
                                                    onBlur={() => {
                                                        const parsed = (activationDaysInput || "")
                                                            .split(",")
                                                            .map((s) => s.trim())
                                                            .filter((s) => s !== "")
                                                            .map((n) => Number(n))
                                                            .filter((n) => !Number.isNaN(n))
                                                            .filter((n) => n >= 1 && n <= 31);
                                                        updateJukebox({ activationDays: parsed });
                                                        setActivationDaysInput(parsed.join(", "));
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            const parsed = (activationDaysInput || "")
                                                                .split(",")
                                                                .map((s) => s.trim())
                                                                .filter((s) => s !== "")
                                                                .map((n) => Number(n))
                                                                .filter((n) => !Number.isNaN(n))
                                                                .filter((n) => n >= 1 && n <= 31);
                                                            updateJukebox({ activationDays: parsed });
                                                            setActivationDaysInput(parsed.join(", "));
                                                        }
                                                    }}
                                                    disabled={!userIsAdmin}
                                                />
                                                <p className="text-xs text-muted-foreground">Use numbers 1-31</p>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {userIsAdmin && (
                        <div className="sticky bottom-0 left-0 right-0 ">
                            <Button className="w-full" size="lg" onClick={saveSettings}>
                                Save Changes
                            </Button>
                        </div>
                    )}

                    {/* Members Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Members ({group.members.length})</CardTitle>
                            <CardDescription>Manage group members</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">Name</TableHead>
                                        <TableHead className="text-right">Joined At</TableHead>
                                        {userIsAdmin && (
                                            <TableHead className="text-right">Remove</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.members.map((member) => (
                                        <TableRow key={member.user.toString()}>
                                            <TableCell className="font-medium">{member.name || "N/A"}</TableCell>
                                            <TableCell className="text-right">{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "N/A"}</TableCell>
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
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will remove {member.name} from the group.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={kickMember} className="bg-destructive">
                                                                    Kick
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Danger Zone Card */}
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>Irreversible actions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="destructive" className="w-full">
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
                                            <AlertDialogAction onClick={leaveGroup} className="bg-destructive">
                                                Leave
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </Button>

                            {userIsAdmin && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full">
                                            <Trash />
                                            <span>Delete Group</span>
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
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <p>Group not found.</p>
            )}
        </>
    );
}
