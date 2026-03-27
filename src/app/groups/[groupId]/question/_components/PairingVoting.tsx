"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import type { QuestionWithUserStateDTO } from "@/types/models/question";

// Palette of distinct pair colors — bg + text combos that work on light & dark
const PAIR_COLORS = [
    "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40",
    "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
    "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40",
    "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/40",
    "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40",
    "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40",
    "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40",
    "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/40",
    "bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/40",
    "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40",
];

function PairButton({
    label,
    colorIdx,
    isActive,
    isDisabled,
    isSelectable,
    onClick,
    onUnpair,
}: {
    label: string;
    colorIdx: number;
    isActive?: boolean;
    isDisabled?: boolean;
    isSelectable?: boolean;
    onClick: () => void;
    onUnpair?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            onDoubleClick={onUnpair}
            disabled={isDisabled}
            className={cn(
                "rounded-lg px-3 py-3 text-sm font-medium text-center transition-all border-2",
                isActive
                    ? "border-foreground bg-foreground/10 scale-[1.02]"
                    : colorIdx >= 0
                      ? PAIR_COLORS[colorIdx]
                      : "border-transparent bg-secondary",
                isDisabled && "opacity-30",
                isSelectable && colorIdx < 0 && "ring-1 ring-foreground/20 cursor-pointer"
            )}
        >
            {label}
        </button>
    );
}

const PairingVoting = ({
    question,
    onVote,
}: {
    question: Pick<QuestionWithUserStateDTO, "_id" | "groupId" | "pairing">;
    onVote: () => void;
}) => {
    const keys = question.pairing?.keys || [];
    const values = question.pairing?.values || [];
    const isExclusive = question.pairing?.mode === "exclusive";

    // selections: key -> value
    const [selections, setSelections] = useState<Record<string, string>>({});

    // ── Exclusive mode state: tap key first, then value ──
    const [activeKey, setActiveKey] = useState<string | null>(null);

    // ── Open mode state: tap value first, then keys ──
    const [activeValue, setActiveValue] = useState<string | null>(null);

    // Assign a stable color index per paired key (order they appear)
    const pairedKeys = keys.filter((k) => selections[k]);
    const keyColorIndex = (key: string): number => {
        const idx = pairedKeys.indexOf(key);
        return idx >= 0 ? idx % PAIR_COLORS.length : -1;
    };

    // ── Exclusive mode: value gets the color of its paired key ──
    const valueColorIndexExclusive = (value: string): number => {
        const pairedKey = pairedKeys.find((k) => selections[k] === value);
        if (!pairedKey) return -1;
        return keyColorIndex(pairedKey);
    };

    // ── Open mode: value gets its own color (by order of distinct values used) ──
    const usedValuesOrdered = [...new Set(pairedKeys.map((k) => selections[k]))];
    const valueColorIndexOpen = (value: string): number => {
        const idx = usedValuesOrdered.indexOf(value);
        return idx >= 0 ? idx % PAIR_COLORS.length : -1;
    };

    const usedValues = isExclusive ? new Set(Object.values(selections)) : new Set<string>();

    // ── Exclusive mode handlers ──
    const handleKeyTapExclusive = (key: string) => {
        setActiveKey((prev) => (prev === key ? null : key));
    };

    const handleValueTapExclusive = (value: string) => {
        if (!activeKey) return;
        if (isExclusive && usedValues.has(value) && selections[activeKey] !== value) return;

        setSelections((prev) => {
            const next = { ...prev };
            if (next[activeKey!] === value) {
                delete next[activeKey!];
            } else {
                next[activeKey!] = value;
            }
            return next;
        });
        setActiveKey(null);
    };

    // ── Open mode handlers: tap value first, then assign to keys ──
    const handleValueTapOpen = (value: string) => {
        setActiveValue((prev) => (prev === value ? null : value));
    };

    const handleKeyTapOpen = (key: string) => {
        if (!activeValue) return;

        setSelections((prev) => {
            const next = { ...prev };
            if (next[key] === activeValue) {
                delete next[key];
            } else {
                next[key] = activeValue;
            }
            return next;
        });
    };

    const handleUnpair = (key: string) => {
        setSelections((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        if (activeKey === key) setActiveKey(null);
    };

    const allSelected = keys.every((key) => selections[key]);

    const submitVote = async () => {
        await fetch(`/api/groups/${question.groupId}/question/${question._id}/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ response: selections }),
        });
        onVote();
    };

    const submitFooter = (
        <div className="fixed bottom-0 left-0 w-full backdrop-blur-md pb-10 pt-4 px-6">
            <Button
                onClick={() => allSelected && submitVote()}
                disabled={!allSelected}
                className="w-full h-12 text-lg font-bold"
            >
                Submit
            </Button>
        </div>
    );

    // ── Exclusive mode: keys left, values right ──
    if (isExclusive) {
        return (
            <div className="flex flex-col">
                <div className="grid grid-cols-2 gap-3 pb-32">
                    <div className="flex flex-col gap-2">
                        <span className="text-xs text-muted-foreground font-medium mb-1">
                            Match
                        </span>
                        {keys.map((key) => {
                            const colorIdx = keyColorIndex(key);
                            return (
                                <PairButton
                                    key={key}
                                    label={key}
                                    colorIdx={colorIdx}
                                    isActive={activeKey === key}
                                    onClick={() => handleKeyTapExclusive(key)}
                                    onUnpair={() => colorIdx >= 0 && handleUnpair(key)}
                                />
                            );
                        })}
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-xs text-muted-foreground font-medium mb-1">With</span>
                        {values.map((value) => {
                            const colorIdx = valueColorIndexExclusive(value);
                            const isDisabled =
                                usedValues.has(value) && selections[activeKey ?? ""] !== value;
                            return (
                                <PairButton
                                    key={value}
                                    label={value}
                                    colorIdx={colorIdx}
                                    isDisabled={!activeKey || isDisabled}
                                    isSelectable={activeKey !== null && !isDisabled}
                                    onClick={() => handleValueTapExclusive(value)}
                                />
                            );
                        })}
                    </div>
                </div>

                {submitFooter}
            </div>
        );
    }

    // ── Open mode: values left (tap first), keys right (assign to) ──
    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-2 gap-3 pb-32">
                <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground font-medium mb-1">
                        Pick value
                    </span>
                    {values.map((value) => {
                        const colorIdx = valueColorIndexOpen(value);
                        return (
                            <PairButton
                                key={value}
                                label={value}
                                colorIdx={colorIdx}
                                isActive={activeValue === value}
                                onClick={() => handleValueTapOpen(value)}
                            />
                        );
                    })}
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground font-medium mb-1">
                        Then assign
                    </span>
                    {keys.map((key) => {
                        const colorIdx = keyColorIndex(key);
                        const keyValueColor =
                            colorIdx >= 0 ? valueColorIndexOpen(selections[key]) : -1;
                        return (
                            <PairButton
                                key={key}
                                label={key}
                                colorIdx={keyValueColor}
                                isDisabled={!activeValue}
                                isSelectable={activeValue !== null}
                                onClick={() => handleKeyTapOpen(key)}
                                onUnpair={() => colorIdx >= 0 && handleUnpair(key)}
                            />
                        );
                    })}
                </div>
            </div>

            {submitFooter}
        </div>
    );
};

export default PairingVoting;
