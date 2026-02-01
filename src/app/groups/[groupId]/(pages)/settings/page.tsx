"use client";

import Header from "@/components/ui/custom/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { GroupDTO } from "@/types/models/group";
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
import { Accordion } from "@/components/ui/accordion";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { FeatureStatus } from "@/types/models/appConfig";
import { GroupInfoCard } from "@/components/features/settings/GroupInfoCard";
import { FeatureSettingsAccordionSimple } from "@/components/features/settings/FeatureSettingsAccordionSimple";
import { QuestionSettings } from "@/components/features/settings/QuestionSettings";
import { RallySettings } from "@/components/features/settings/RallySettings";
import { JukeboxSettings } from "@/components/features/settings/JukeboxSettings";

interface IGroupProcessed extends GroupDTO {
    userIsAdmin: boolean;
}

interface ISettings {
    features?: {
        questions: {
            enabled: boolean;
            settings: {
                questionCount: number;
                lastQuestionDate: Date | null;
            };
        };
        rallies: {
            enabled: boolean;
            settings: {
                rallyCount: number;
                rallyGapDays: number;
            };
        };
        jukebox: {
            enabled: boolean;
            settings: {
                concurrent: string[];
                activationDays: number[];
            };
        };
    };
}

export default function GroupPage() {
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    const { user } = useAuthRedirect();
    const { toast } = useToast();
    const [settings, setSettings] = useState<ISettings | any>({});
    const [deleteInput, setDeleteInput] = useState("");
    const [memberToKick, setMemberToKick] = useState<string | null>(null);
    const router = useRouter();

    const {
        data: group,
        isLoading,
        error,
        mutate,
    } = useSWR<IGroupProcessed>(`/api/groups/${groupId}`, fetcher, {});

    const { data: globalFeatures } = useSWR<{
        questions: { status: FeatureStatus };
        rallies: { status: FeatureStatus };
        jukebox: { status: FeatureStatus };
    }>("/api/features/status", fetcher);

    useEffect(() => {
        if (group) {
            setSettings({
                features: group.features || {
                    questions: {
                        enabled: true,
                        settings: {
                            questionCount: 1,
                            lastQuestionDate: null,
                        },
                    },
                    rallies: {
                        enabled: true,
                        settings: {
                            rallyCount: 1,
                            rallyGapDays: 14,
                        },
                    },
                    jukebox: {
                        enabled: true,
                        settings: {
                            concurrent: ["Jukebox"],
                            activationDays: [1],
                        },
                    },
                },
            });
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

    const updateJukebox = (partial: any) => {
        setSettings((prev: any) => ({
            ...prev,
            features: {
                ...(prev?.features || {}),
                jukebox: {
                    ...(prev?.features?.jukebox || {}),
                    settings: {
                        ...(prev?.features?.jukebox?.settings || {}),
                        ...partial,
                    },
                },
            },
        }));
    };

    const saveSettings = async () => {
        try {
            const payload: any = { ...settings };
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
            if (!response.ok) {
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
            const res = await fetch(`/api/groups/${groupId}/members/${user._id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                toast({ title: "Failed to leave group", variant: "destructive" });
            }
            mutate();
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
                    <GroupInfoCard
                        currentMemberName={currentMemberName}
                        groupId={groupId}
                        createdAt={new Date(group.createdAt)}
                        adminName={adminName}
                    />

                    {/* Feature Settings Card */}
                    {userIsAdmin && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Feature Settings</CardTitle>
                                <CardDescription>
                                    Manage features and their settings for this group
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {/* Questions Feature */}
                                    <FeatureSettingsAccordionSimple
                                        featureName="Questions"
                                        featureKey="questions"
                                        globalStatus={globalFeatures?.questions?.status}
                                        description="Configure daily questions settings"
                                    >
                                        <QuestionSettings
                                            questionCount={
                                                settings.features?.questions?.settings
                                                    ?.questionCount || 0
                                            }
                                            lastQuestionDate={
                                                group.features?.questions?.settings
                                                    ?.lastQuestionDate
                                                    ? new Date(
                                                          group.features.questions.settings
                                                              .lastQuestionDate
                                                      )
                                                    : null
                                            }
                                            onQuestionCountChange={(value) => {
                                                setSettings((prev: any) => ({
                                                    ...prev,
                                                    features: {
                                                        ...prev.features,
                                                        questions: {
                                                            ...prev.features.questions,
                                                            settings: {
                                                                ...prev.features.questions.settings,
                                                                questionCount: value,
                                                            },
                                                        },
                                                    },
                                                }));
                                            }}
                                        />
                                    </FeatureSettingsAccordionSimple>

                                    {/* Rallies Feature */}
                                    <FeatureSettingsAccordionSimple
                                        featureName="Rallies"
                                        featureKey="rallies"
                                        globalStatus={globalFeatures?.rallies?.status}
                                        description="Configure rally settings"
                                    >
                                        <RallySettings
                                            rallyCount={
                                                settings.features?.rallies?.settings?.rallyCount ||
                                                0
                                            }
                                            rallyGapDays={
                                                settings.features?.rallies?.settings
                                                    ?.rallyGapDays || 0
                                            }
                                            onRallyCountChange={(value) => {
                                                setSettings((prev: any) => ({
                                                    ...prev,
                                                    features: {
                                                        ...prev.features,
                                                        rallies: {
                                                            ...prev.features.rallies,
                                                            settings: {
                                                                ...prev.features.rallies.settings,
                                                                rallyCount: value,
                                                            },
                                                        },
                                                    },
                                                }));
                                            }}
                                            onRallyGapDaysChange={(value) => {
                                                setSettings((prev: any) => ({
                                                    ...prev,
                                                    features: {
                                                        ...prev.features,
                                                        rallies: {
                                                            ...prev.features.rallies,
                                                            settings: {
                                                                ...prev.features.rallies.settings,
                                                                rallyGapDays: value,
                                                            },
                                                        },
                                                    },
                                                }));
                                            }}
                                        />
                                    </FeatureSettingsAccordionSimple>

                                    {/* Jukebox Feature */}
                                    <FeatureSettingsAccordionSimple
                                        featureName="Jukebox"
                                        featureKey="jukebox"
                                        globalStatus={globalFeatures?.jukebox?.status}
                                        description="Configure jukebox settings"
                                    >
                                        <JukeboxSettings
                                            concurrent={
                                                settings.features?.jukebox?.settings?.concurrent ||
                                                []
                                            }
                                            activationDays={
                                                settings.features?.jukebox?.settings
                                                    ?.activationDays || []
                                            }
                                            onConcurrentChange={(value) =>
                                                updateJukebox({ concurrent: value })
                                            }
                                            onActivationDaysChange={(value) =>
                                                updateJukebox({ activationDays: value })
                                            }
                                        />
                                    </FeatureSettingsAccordionSimple>
                                </Accordion>
                            </CardContent>
                        </Card>
                    )}

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
                                            <TableCell className="font-medium">
                                                {member.name || "N/A"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {member.joinedAt
                                                    ? new Date(member.joinedAt).toLocaleDateString()
                                                    : "N/A"}
                                            </TableCell>
                                            {userIsAdmin && member.user !== user._id && (
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    confirmKickMember(
                                                                        member.user.toString()
                                                                    )
                                                                }
                                                            >
                                                                <UserRoundMinus size={20} />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Are you sure?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone.
                                                                    This will remove {member.name}{" "}
                                                                    from the group.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={kickMember}
                                                                    className="bg-destructive"
                                                                >
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
                                            <AlertDialogTitle>
                                                Are you sure you want to leave?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. You will lose access
                                                to this group.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={leaveGroup}
                                                className="bg-destructive"
                                            >
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
                                            <AlertDialogTitle>
                                                Are you sure you want to delete this group?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action is permanent and cannot be undone. Type{" "}
                                                <strong>{group.name}</strong> to confirm.
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
