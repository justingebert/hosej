"use client";

import Header from "@/components/ui/custom/Header";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/custom/SkeletonList";
import type { GroupDTO } from "@/types/models/group";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { GroupInfoCard } from "@/app/groups/[groupId]/(pages)/settings/_components/GroupInfoCard";
import { GroupFeatureSettingsCard } from "@/app/groups/[groupId]/(pages)/settings/_components/GroupFeatureSettingsCard";
import { GroupMembersCard } from "@/app/groups/[groupId]/(pages)/settings/_components/GroupMembersCard";
import { GroupDangerZoneCard } from "@/app/groups/[groupId]/(pages)/settings/_components/GroupDangerZoneCard";
import { useGroup } from "@/hooks/data/useGroup";
import { useFeatureStatus } from "@/hooks/data/useFeatureStatus";

// ─── Header (renders group name) ─────────────────────────────

function GroupTitleHeader({ groupId }: { groupId: string }) {
    const { group } = useGroup(groupId);
    return <Header title={group?.name ?? null} />;
}

// ─── Form section: GroupInfo + FeatureSettings + Save ────────

function FormSection({ groupId }: { groupId: string }) {
    const { user } = useAuthRedirect();
    const { toast } = useToast();
    const { group, isLoading, updateGroup } = useGroup(groupId);
    const { features: globalFeatures } = useFeatureStatus();

    const [features, setFeatures] = useState<GroupDTO["features"] | null>(null);
    const [syncedFeaturesKey, setSyncedFeaturesKey] = useState<string | null>(null);
    const nextFeaturesKey = group ? `${group._id}:${JSON.stringify(group.features)}` : null;

    if (nextFeaturesKey !== syncedFeaturesKey) {
        setFeatures(group?.features ?? null);
        setSyncedFeaturesKey(nextFeaturesKey);
    }

    if (isLoading || !group || !features) {
        return <SkeletonList count={6} className="h-12 mb-4" />;
    }

    const userIsAdmin = !!group.userIsAdmin;

    const adminName = group.admin
        ? group.members.find((member) => member.user === group.admin)?.name || "N/A"
        : "N/A";

    const currentMember = group.members.find((member) => member.user === user?._id);
    const currentMemberName = currentMember?.name || "Member not found";

    const updateQuestionSettings = (
        partial: Partial<GroupDTO["features"]["questions"]["settings"]>
    ) => {
        setFeatures((prev) =>
            prev
                ? {
                      ...prev,
                      questions: {
                          ...prev.questions,
                          settings: { ...prev.questions.settings, ...partial },
                      },
                  }
                : prev
        );
    };

    const updateRallySettings = (partial: Partial<GroupDTO["features"]["rallies"]["settings"]>) => {
        setFeatures((prev) =>
            prev
                ? {
                      ...prev,
                      rallies: {
                          ...prev.rallies,
                          settings: { ...prev.rallies.settings, ...partial },
                      },
                  }
                : prev
        );
    };

    const updateJukeboxSettings = (
        partial: Partial<GroupDTO["features"]["jukebox"]["settings"]>
    ) => {
        setFeatures((prev) =>
            prev
                ? {
                      ...prev,
                      jukebox: {
                          ...prev.jukebox,
                          settings: { ...prev.jukebox.settings, ...partial },
                      },
                  }
                : prev
        );
    };

    const saveSettings = async () => {
        try {
            await updateGroup({
                features: {
                    questions: {
                        enabled: features.questions.enabled,
                        settings: {
                            questionCount: features.questions.settings.questionCount,
                            packs: features.questions.settings.packs,
                        },
                    },
                    rallies: {
                        enabled: features.rallies.enabled,
                        settings: features.rallies.settings,
                    },
                    jukebox: {
                        enabled: features.jukebox.enabled,
                        settings: features.jukebox.settings,
                    },
                },
            });
            toast({ title: "Group Settings saved" });
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast({ title: "Failed to save Settings", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <GroupInfoCard
                currentMemberName={currentMemberName}
                groupId={groupId}
                createdAt={new Date(group.createdAt)}
                adminName={adminName}
            />

            {userIsAdmin && (
                <GroupFeatureSettingsCard
                    groupId={groupId}
                    features={features}
                    globalFeatures={globalFeatures}
                    onQuestionCountChange={(value) =>
                        updateQuestionSettings({ questionCount: value })
                    }
                    onRallyCountChange={(value) => updateRallySettings({ rallyCount: value })}
                    onRallyGapDaysChange={(value) => updateRallySettings({ rallyGapDays: value })}
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
        </div>
    );
}

// ─── Members section ─────────────────────────────────────────

function MembersSection({ groupId }: { groupId: string }) {
    const { user } = useAuthRedirect();
    const { toast } = useToast();
    const { group, isLoading, kickMember } = useGroup(groupId);

    if (isLoading || !group) return <SkeletonList count={3} className="h-12 mb-4" />;
    if (!user) return null;

    const userIsAdmin = !!group.userIsAdmin;

    const handleKick = async (memberId: string) => {
        try {
            await kickMember(memberId);
            toast({ title: "Member kicked" });
        } catch (error) {
            console.error("Failed to kick member:", error);
            toast({ title: "Failed to kick member", variant: "destructive" });
        }
    };

    return (
        <GroupMembersCard
            members={group.members}
            currentUserId={user._id}
            userIsAdmin={userIsAdmin}
            onKickMember={handleKick}
        />
    );
}

// ─── Danger Zone section ─────────────────────────────────────

function DangerZoneSection({ groupId }: { groupId: string }) {
    const { user } = useAuthRedirect();
    const { toast } = useToast();
    const router = useRouter();
    const { group, isLoading, deleteGroup, leaveGroup } = useGroup(groupId);

    if (isLoading || !group) return <SkeletonList count={2} className="h-12 mb-4" />;

    const userIsAdmin = !!group.userIsAdmin;

    const handleLeaveGroup = async () => {
        if (!user) return;
        try {
            await leaveGroup(user._id);
            toast({ title: "You have left the group" });
            router.push("/groups");
        } catch (error) {
            console.error("Failed to leave group:", error);
            toast({ title: "Failed to leave group", variant: "destructive" });
        }
    };

    const handleDeleteGroup = async () => {
        if (!userIsAdmin) return;
        try {
            await deleteGroup();
            toast({ title: "Group deleted successfully" });
            router.push("/groups");
        } catch (error) {
            console.error("Failed to delete group:", error);
            toast({ title: "Failed to delete group", variant: "destructive" });
        }
    };

    return (
        <GroupDangerZoneCard
            groupName={group.name}
            userIsAdmin={userIsAdmin}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
        />
    );
}

// ─── Page shell ──────────────────────────────────────────────

export default function GroupSettingsPage() {
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";

    return (
        <>
            <GroupTitleHeader groupId={groupId} />

            <div className="space-y-6 pb-12">
                <FormSection groupId={groupId} />
                <MembersSection groupId={groupId} />
                <DangerZoneSection groupId={groupId} />
            </div>
        </>
    );
}
