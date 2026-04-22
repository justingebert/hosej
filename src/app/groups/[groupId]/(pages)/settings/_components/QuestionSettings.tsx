"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useState } from "react";
import type { QuestionPackDTO } from "@/types/models/questionPack";
import { cn } from "@/lib/utils/utils";

const COUNT_CHOICES = [1, 2, 3];

interface QuestionSettingsProps {
    groupId: string;
    questionCount: number;
    lastQuestionDate: string | null;
    onQuestionCountChange: (value: number) => void;
}

type PackWithStatus = QuestionPackDTO & { added: boolean };

export function QuestionSettings({
    groupId,
    questionCount,
    lastQuestionDate,
    onQuestionCountChange,
}: QuestionSettingsProps) {
    const { toast } = useToast();
    const [addingPackId, setAddingPackId] = useState<string | null>(null);

    const { data: packs, mutate } = useSWR<PackWithStatus[]>(
        groupId ? `/api/groups/${groupId}/question-packs` : null,
        fetcher
    );

    const addPack = async (packId: string) => {
        toast({
            title: "Not Supported yet",
            description: `Please contact an admin to get acess`,
        });

        // setAddingPackId(packId);
        // try {
        //     const response = await fetch(`/api/groups/${groupId}/question-packs`, {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify({ packId }),
        //     });
        //
        //     if (!response.ok) {
        //         const data = await response.json();
        //         throw new Error(data.message || "Failed to add pack");
        //     }
        //
        //     toast({
        //         title: "Pack Added",
        //         description: `Question pack added to the group`,
        //     });
        //
        //     mutate();
        // } catch (error) {
        //     toast({
        //         title: "Error",
        //         description: error instanceof Error ? error.message : "Failed to add pack",
        //         variant: "destructive",
        //     });
        // } finally {
        //     setAddingPackId(null);
        // }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                        <Label>Questions per Day</Label>
                        <div className="inline-flex rounded-md border border-input overflow-hidden">
                            {COUNT_CHOICES.map((n, idx) => {
                                const selected = questionCount === n;
                                return (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => onQuestionCountChange(n)}
                                        aria-pressed={selected}
                                        className={cn(
                                            "h-9 w-10 text-sm font-medium transition-colors",
                                            idx > 0 && "border-l border-input",
                                            selected
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-background hover:bg-accent"
                                        )}
                                    >
                                        {n}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {packs && packs.length > 0 && (
                <div className="space-y-3">
                    <Label>Question Packs</Label>
                    <div className="space-y-2">
                        {packs.map((pack) => (
                            <div
                                key={pack.packId}
                                className="flex items-center justify-between gap-2 rounded-lg border p-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm truncate">
                                            {pack.name}
                                        </span>
                                        {pack.category && (
                                            <Badge variant="secondary" className="text-xs">
                                                {pack.category}
                                            </Badge>
                                        )}
                                    </div>
                                    {pack.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {pack.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {pack.questionCount} questions
                                    </p>
                                </div>
                                {pack.added ? (
                                    <Badge variant="outline">Added</Badge>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={addingPackId === pack.packId}
                                        onClick={() => addPack(pack.packId)}
                                    >
                                        {addingPackId === pack.packId ? "Adding..." : "Add"}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
