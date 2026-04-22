"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/utils";

const MAX_JUKEBOXES = 3;
const LAST_DAY_SENTINEL = 0;
const DAY_CHOICES = Array.from({ length: 28 }, (_, i) => i + 1);
const DEFAULT_NAME_POOL = ["Jukebox", "Jukebox 2", "Jukebox 3"];

interface JukeboxSettingsProps {
    concurrent: string[];
    activationDays: number[];
    onConcurrentChange: (value: string[]) => void;
    onActivationDaysChange: (value: number[]) => void;
}

export function JukeboxSettings({
    concurrent,
    activationDays,
    onConcurrentChange,
    onActivationDaysChange,
}: JukeboxSettingsProps) {
    const [draftNames, setDraftNames] = useState<string[]>(concurrent);
    const [nameError, setNameError] = useState<{ index: number; message: string } | null>(null);

    useEffect(() => {
        setDraftNames(concurrent);
    }, [concurrent]);

    const updateDraft = (index: number, value: string) => {
        setDraftNames((prev) => prev.map((n, i) => (i === index ? value : n)));
        if (nameError?.index === index) {
            setNameError(null);
        }
    };

    const commitName = (index: number) => {
        const trimmed = draftNames[index].trim();
        const previous = concurrent[index];

        if (trimmed.length === 0) {
            setNameError({ index, message: "Name cannot be empty" });
            setDraftNames((prev) => prev.map((n, i) => (i === index ? previous : n)));
            return;
        }

        const collidesWithOther = draftNames.some(
            (other, i) => i !== index && other.trim().toLowerCase() === trimmed.toLowerCase()
        );
        if (collidesWithOther) {
            setNameError({ index, message: "Name must be unique" });
            setDraftNames((prev) => prev.map((n, i) => (i === index ? previous : n)));
            return;
        }

        setNameError(null);
        if (trimmed === previous) return;
        onConcurrentChange(concurrent.map((n, i) => (i === index ? trimmed : n)));
    };

    const addJukebox = () => {
        if (concurrent.length >= MAX_JUKEBOXES) return;
        const used = new Set(concurrent.map((n) => n.toLowerCase()));
        const next =
            DEFAULT_NAME_POOL.find((candidate) => !used.has(candidate.toLowerCase())) ??
            `Jukebox ${concurrent.length + 1}`;
        onConcurrentChange([...concurrent, next]);
    };

    const removeJukebox = (index: number) => {
        if (concurrent.length <= 1) return;
        onConcurrentChange(concurrent.filter((_, i) => i !== index));
    };

    const toggleDay = (day: number) => {
        const next = activationDays.includes(day)
            ? activationDays.filter((d) => d !== day)
            : [...activationDays, day].sort((a, b) => a - b);
        onActivationDaysChange(next);
    };

    const hasLastDay = activationDays.includes(LAST_DAY_SENTINEL);
    const numericDays = activationDays.filter((d) => d > 0).sort((a, b) => a - b);
    const summary = buildActivationSummary(numericDays, hasLastDay);

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="space-y-1">
                    <Label>Concurrent Jukeboxes</Label>
                    <p className="text-xs text-muted-foreground">
                        Up to {MAX_JUKEBOXES} themed jukeboxes run side-by-side each cycle. Members
                        submit songs to each of them.
                    </p>
                </div>

                <div className="space-y-2">
                    {draftNames.map((name, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={name}
                                    maxLength={40}
                                    onChange={(e) => updateDraft(i, e.target.value)}
                                    onBlur={() => commitName(i)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    aria-invalid={nameError?.index === i}
                                    aria-label={`Jukebox ${i + 1} name`}
                                    className={cn(
                                        nameError?.index === i &&
                                            "border-destructive focus-visible:ring-destructive"
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeJukebox(i)}
                                    disabled={concurrent.length <= 1}
                                    aria-label={`Remove ${name}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            {nameError?.index === i && (
                                <p className="text-xs text-destructive">{nameError.message}</p>
                            )}
                        </div>
                    ))}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addJukebox}
                    disabled={concurrent.length >= MAX_JUKEBOXES}
                    className="w-full"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Add jukebox ({concurrent.length}/{MAX_JUKEBOXES})
                </Button>
            </div>

            <div className="space-y-3">
                <div className="space-y-1">
                    <Label>Activation Days</Label>
                    <p className="text-xs text-muted-foreground">
                        Days of the month when a fresh jukebox cycle starts.
                    </p>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                    {DAY_CHOICES.map((day) => {
                        const selected = activationDays.includes(day);
                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(day)}
                                aria-pressed={selected}
                                className={cn(
                                    "h-9 rounded-md border text-sm font-medium transition-colors",
                                    selected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-input bg-background hover:bg-accent"
                                )}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => toggleDay(LAST_DAY_SENTINEL)}
                    aria-pressed={hasLastDay}
                    className={cn(
                        "w-full h-9 rounded-md border text-sm font-medium transition-colors",
                        hasLastDay
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background hover:bg-accent"
                    )}
                >
                    Last day of month
                </button>

                {summary ? (
                    <p className="text-xs text-muted-foreground">{summary}</p>
                ) : (
                    <p className="text-xs text-destructive">
                        No days selected — jukebox will never refresh.
                    </p>
                )}
            </div>
        </div>
    );
}

function buildActivationSummary(numericDays: number[], hasLastDay: boolean): string | null {
    const parts: string[] = [];
    if (numericDays.length > 0) parts.push(numericDays.join(", "));
    if (hasLastDay) parts.push("last day");
    if (parts.length === 0) return null;
    return `Activates on ${parts.join(" and ")} of every month`;
}
