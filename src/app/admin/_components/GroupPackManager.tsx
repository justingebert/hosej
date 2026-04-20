"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import type { QuestionPackDTO } from "@/types/models/questionPack";

interface AdminGroup {
    _id: string;
    name: string;
    memberCount: number;
}

type PackWithStatus = QuestionPackDTO & { added: boolean };

export default function GroupPackManager() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<AdminGroup | null>(null);
    const [addingPackId, setAddingPackId] = useState<string | null>(null);

    const { data: groups } = useSWR<AdminGroup[]>("/api/admin/groups", fetcher, {
        onError: () => {},
        shouldRetryOnError: false,
    });

    const { data: packs, mutate } = useSWR<PackWithStatus[]>(
        selectedGroup ? `/api/groups/${selectedGroup._id}/question-packs` : null,
        fetcher,
        {
            onError: () => {},
            shouldRetryOnError: false,
        }
    );

    const addPack = async (packId: string) => {
        if (!selectedGroup) return;
        setAddingPackId(packId);
        try {
            const response = await fetch(`/api/groups/${selectedGroup._id}/question-packs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to add pack");
            }

            toast({ title: "Pack Added", description: `Pack added to ${selectedGroup.name}` });
            mutate();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add pack",
                variant: "destructive",
            });
        } finally {
            setAddingPackId(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <div>
                        <CardTitle>Manage Group Packs</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between font-normal"
                        >
                            {selectedGroup ? (
                                <span className="truncate">
                                    {selectedGroup.name}
                                    <span className="text-muted-foreground ml-1">
                                        ({selectedGroup.memberCount} members)
                                    </span>
                                </span>
                            ) : (
                                <span className="text-muted-foreground">Select a group...</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                            <CommandInput placeholder="Search groups..." />
                            <CommandList>
                                <CommandEmpty>No groups found.</CommandEmpty>
                                <CommandGroup>
                                    {groups?.map((group) => (
                                        <CommandItem
                                            key={group._id}
                                            value={group.name}
                                            onSelect={() => {
                                                setSelectedGroup(group);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedGroup?._id === group._id
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            <span className="truncate">{group.name}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                {group.memberCount} members
                                            </span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {selectedGroup && packs && packs.length > 0 && (
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
                                    </div>
                                    {pack.tags && pack.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {pack.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
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
                                    <Badge variant="outline" className="shrink-0">
                                        Added
                                    </Badge>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0"
                                        disabled={addingPackId === pack.packId}
                                        onClick={() => addPack(pack.packId)}
                                    >
                                        {addingPackId === pack.packId ? "Adding..." : "Add"}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {selectedGroup && packs && packs.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No question packs available. Upload some first.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
