"use client";

import Header from "@/components/ui/custom/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { GroupDTO } from "@/types/models/group";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { FeatureStatus } from "@/types/models/appConfig";
import { GroupInfoCard } from "@/components/features/settings/GroupInfoCard";
import { GroupFeatureSettingsCard } from "@/components/features/settings/GroupFeatureSettingsCard";
import { GroupMembersCard } from "@/components/features/settings/GroupMembersCard";
import { GroupDangerZoneCard } from "@/components/features/settings/GroupDangerZoneCard";

type GroupProcessedDTO = GroupDTO & { userIsAdmin: boolean };

export default function GroupSettingsPage() {
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    const { user } = useAuthRedirect();
    const { toast } = useToast();
    const [features, setFeatures] = useState<GroupDTO["features"] | null>(null);
    const router = useRouter();

    const {
        data: group,
        isLoading,
        error,
        mutate,
    } = useSWR<GroupProcessedDTO>(`/api/groups/${groupId}`, fetcher, {});

    const { data: globalFeatures } = useSWR<{
        questions: { status: FeatureStatus };
        rallies: { status: FeatureStatus };
        jukebox: { status: FeatureStatus };
    }>("/api/features/status", fetcher);

    useEffect(() => {
        if (group) {
            setFeatures(group.features);
        }
    }, [group]);

    if (error) return <p className="text-red-500">Failed to load group data</p>;

    const userIsAdmin = !!group?.userIsAdmin;

    const adminName = group?.admin
        ? group.members.find((member) => member.user === group.admin)?.name || "N/A"
        : "N/A";

    const currentMember = group?.members.find((member) => member.user === user?._id);
    const currentMemberName = currentMember?.name || "Member not found";

    const updateQuestionSettings = (
        partial: Partial<GroupDTO["features"]["questions"]["settings"]>
    ) => {
        setFeatures((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                questions: {
                    ...prev.questions,
                    settings: { ...prev.questions.settings, ...partial },
                },
            };
        });
    };

    const updateRallySettings = (partial: Partial<GroupDTO["features"]["rallies"]["settings"]>) => {
        setFeatures((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                rallies: {
                    ...prev.rallies,
                    settings: { ...prev.rallies.settings, ...partial },
                },
            };
        });
    };

    const updateJukeboxSettings = (
        partial: Partial<GroupDTO["features"]["jukebox"]["settings"]>
    ) => {
        setFeatures((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                jukebox: {
                    ...prev.jukebox,
                    settings: { ...prev.jukebox.settings, ...partial },
                },
            };
        });
    };

    const saveSettings = async () => {
        try {
            if (!features) return;
            await fetch(`/api/groups/${groupId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ features }),
            });
            toast({ title: "Group Settings saved" });
            mutate();
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast({ title: "Failed to save Settings", variant: "destructive" });
        }
    };

    const kickMember = async (memberId: string) => {
        try {
            const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
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
        }
    };

    const leaveGroup = async () => {
        try {
            const res = await fetch(`/api/groups/${groupId}/members/${user?._id}`, {
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
        if (!userIsAdmin || !group) return;
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
            <Header title={group?.name || null} />

            {isLoading ? (
                [...Array(10)].map((_, i) => <Skeleton className="h-12 mb-4 mt" key={i} />)
            ) : !group ? (
                <p>Group not found.</p>
            ) : !user || !features ? (
                [...Array(10)].map((_, i) => <Skeleton className="h-12 mb-4 mt" key={i} />)
            ) : (
                <div className="space-y-6 pb-12">
                    <GroupInfoCard
                        currentMemberName={currentMemberName}
                        groupId={groupId}
                        createdAt={new Date(group.createdAt)}
                        adminName={adminName}
                    />

                    {userIsAdmin && (
                        <GroupFeatureSettingsCard
                            features={features}
                            globalFeatures={globalFeatures}
                            onQuestionCountChange={(value) =>
                                updateQuestionSettings({ questionCount: value })
                            }
                            onRallyCountChange={(value) =>
                                updateRallySettings({ rallyCount: value })
                            }
                            onRallyGapDaysChange={(value) =>
                                updateRallySettings({ rallyGapDays: value })
                            }
                            onJukeboxConcurrentChange={(value) =>
                                updateJukeboxSettings({ concurrent: value })
                            }
                            onJukeboxActivationDaysChange={(value) =>
                                updateJukeboxSettings({ activationDays: value })
                            }
                        />
                    )}

                    {userIsAdmin && (
                        <div className="sticky bottom-0 left-0 right-0 ">
                            <Button className="w-full" size="lg" onClick={saveSettings}>
                                Save Changes
                            </Button>
                        </div>
                    )}

                    <GroupMembersCard
                        members={group.members}
                        currentUserId={user._id}
                        userIsAdmin={userIsAdmin}
                        onKickMember={kickMember}
                    />

                    <GroupDangerZoneCard
                        groupName={group.name}
                        userIsAdmin={userIsAdmin}
                        onLeaveGroup={leaveGroup}
                        onDeleteGroup={deleteGroup}
                    />
                </div>
            )}
        </>
    );
}
