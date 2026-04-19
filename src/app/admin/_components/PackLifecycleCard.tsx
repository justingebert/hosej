"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ResponsiveConfirm from "@/components/common/ResponsiveConfirm";
import { useToast } from "@/hooks/use-toast";
import { Layers, Trash2 } from "lucide-react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { QuestionPackDTO } from "@/types/models/questionPack";
import { QuestionPackStatus } from "@/types/models/questionPack";

type StatusAction =
    | { label: "Deprecate"; next: QuestionPackStatus.Deprecated }
    | { label: "Restore"; next: QuestionPackStatus.Active }
    | { label: "Archive"; next: QuestionPackStatus.Archived };

function actionsFor(status: QuestionPackStatus | undefined): StatusAction[] {
    switch (status) {
        case QuestionPackStatus.Deprecated:
            return [
                { label: "Restore", next: QuestionPackStatus.Active },
                { label: "Archive", next: QuestionPackStatus.Archived },
            ];
        case QuestionPackStatus.Archived:
            return [{ label: "Restore", next: QuestionPackStatus.Active }];
        case QuestionPackStatus.Active:
        default:
            return [
                { label: "Deprecate", next: QuestionPackStatus.Deprecated },
                { label: "Archive", next: QuestionPackStatus.Archived },
            ];
    }
}

function statusBadgeVariant(
    status: QuestionPackStatus | undefined
): "default" | "secondary" | "outline" | "destructive" {
    switch (status) {
        case QuestionPackStatus.Deprecated:
            return "secondary";
        case QuestionPackStatus.Archived:
            return "outline";
        case QuestionPackStatus.Active:
        default:
            return "default";
    }
}

export default function PackLifecycleCard() {
    const { toast } = useToast();
    const [busyPackId, setBusyPackId] = useState<string | null>(null);

    const { data: packs, mutate } = useSWR<QuestionPackDTO[]>(
        "/api/admin/question-packs",
        fetcher,
        { onError: () => {}, shouldRetryOnError: false }
    );

    const changeStatus = async (packId: string, status: QuestionPackStatus) => {
        setBusyPackId(packId);
        try {
            const response = await fetch(`/api/admin/question-packs/${packId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to update pack status");
            }

            toast({ title: "Pack Updated", description: `Status set to ${status}` });
            mutate();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update pack",
                variant: "destructive",
            });
        } finally {
            setBusyPackId(null);
        }
    };

    const deletePack = async (pack: QuestionPackDTO) => {
        setBusyPackId(pack.packId);
        try {
            const response = await fetch(`/api/admin/question-packs/${pack.packId}`, {
                method: "DELETE",
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to delete pack");
            }

            toast({
                title: "Pack Deleted",
                description: `Removed ${data.templatesDeleted} template(s), updated ${data.groupsUpdated} group(s)`,
            });
            mutate();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete pack",
                variant: "destructive",
            });
        } finally {
            setBusyPackId(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 shrink-0" />
                    <div>
                        <CardTitle>Question Packs</CardTitle>
                        <CardDescription>
                            Deprecate, archive, or delete packs. Deprecated packs stay on groups
                            that already have them but are hidden from new additions.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {packs && packs.length === 0 && (
                    <p className="text-sm text-muted-foreground">No packs yet.</p>
                )}
                {packs?.map((pack) => {
                    const isBusy = busyPackId === pack.packId;
                    const actions = actionsFor(pack.status);
                    return (
                        <div key={pack.packId} className="rounded-lg border p-3 space-y-3">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-sm truncate">
                                        {pack.name}
                                    </span>
                                    <Badge
                                        variant={statusBadgeVariant(pack.status)}
                                        className="text-xs shrink-0"
                                    >
                                        {pack.status ?? QuestionPackStatus.Active}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {pack.packId}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span>{pack.questionCount} questions</span>
                                    {pack.category && <span>· {pack.category}</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                                {actions.map((action) => (
                                    <Button
                                        key={action.label}
                                        size="sm"
                                        variant="outline"
                                        disabled={isBusy}
                                        onClick={() => changeStatus(pack.packId, action.next)}
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                                <ResponsiveConfirm
                                    trigger={
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            disabled={isBusy}
                                            className={
                                                actions.length % 2 === 0
                                                    ? "col-span-2 sm:col-auto"
                                                    : undefined
                                            }
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Delete
                                        </Button>
                                    }
                                    title={`Delete pack "${pack.name}"?`}
                                    description={
                                        <>
                                            Permanently deletes the pack and all{" "}
                                            {pack.questionCount} of its templates, and removes it
                                            from every group that has it. Questions already created
                                            from this pack remain, but their templateId will no
                                            longer resolve.
                                        </>
                                    }
                                    confirmLabel="Delete"
                                    onConfirm={() => deletePack(pack)}
                                />
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
