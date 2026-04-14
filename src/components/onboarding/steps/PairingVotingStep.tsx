"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAIR_COLORS = [
    "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40",
    "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
    "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40",
];

const KEYS = ["Dog", "Cat", "Bird"];
const VALUES = ["Woof", "Meow", "Tweet"];

function PairButton({
    label,
    colorIdx,
    isActive,
    isDisabled,
    isSelectable,
    onClick,
}: {
    label: string;
    colorIdx: number;
    isActive?: boolean;
    isDisabled?: boolean;
    isSelectable?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
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

export function PairingVotingStep() {
    const [selections, setSelections] = useState<Record<number, number>>({});
    const [activeKey, setActiveKey] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const pairedKeyIndices = KEYS.map((_, i) => i).filter((i) => selections[i] !== undefined);
    const keyColorIndex = (keyIdx: number): number => {
        const idx = pairedKeyIndices.indexOf(keyIdx);
        return idx >= 0 ? idx % PAIR_COLORS.length : -1;
    };
    const valueColorIndex = (valueIdx: number): number => {
        const pairedKeyIdx = pairedKeyIndices.find((ki) => selections[ki] === valueIdx);
        if (pairedKeyIdx === undefined) return -1;
        return keyColorIndex(pairedKeyIdx);
    };

    const usedValues = new Set(pairedKeyIndices.map((ki) => selections[ki]));
    const allSelected = KEYS.every((_, i) => selections[i] !== undefined);

    const handleKeyTap = (ki: number) => {
        setActiveKey((prev) => (prev === ki ? null : ki));
    };

    const handleValueTap = (vi: number) => {
        if (activeKey === null) return;
        if (usedValues.has(vi) && selections[activeKey] !== vi) return;
        setSelections((prev) => {
            const next = { ...prev };
            if (next[activeKey] === vi) {
                delete next[activeKey];
            } else {
                next[activeKey] = vi;
            }
            return next;
        });
        setActiveKey(null);
    };

    return (
        <div className="flex flex-col gap-4 py-2">
            <div>
                <h2 className="text-lg font-bold mb-1">Pairing Questions</h2>
                <p className="text-sm text-muted-foreground">
                    Match items together! Tap a left item, then tap the right item to pair them.
                </p>
            </div>

            <div className="rounded-xl bg-secondary/30 p-4">
                <p className="font-semibold text-center mb-4">Match the animal to its sound</p>

                <AnimatePresence mode="wait">
                    {!submitted ? (
                        <motion.div
                            key="pair"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col gap-3"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs text-muted-foreground font-medium mb-1">
                                        Match
                                    </span>
                                    {KEYS.map((key, ki) => (
                                        <PairButton
                                            key={ki}
                                            label={key}
                                            colorIdx={keyColorIndex(ki)}
                                            isActive={activeKey === ki}
                                            onClick={() => handleKeyTap(ki)}
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs text-muted-foreground font-medium mb-1">
                                        With
                                    </span>
                                    {VALUES.map((value, vi) => {
                                        const colorIdx = valueColorIndex(vi);
                                        const isDisabled =
                                            usedValues.has(vi) &&
                                            (activeKey === null || selections[activeKey] !== vi);
                                        return (
                                            <PairButton
                                                key={vi}
                                                label={value}
                                                colorIdx={colorIdx}
                                                isDisabled={activeKey === null || isDisabled}
                                                isSelectable={activeKey !== null && !isDisabled}
                                                onClick={() => handleValueTap(vi)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            <Button
                                className="w-full mt-2"
                                disabled={!allSelected}
                                onClick={() => setSubmitted(true)}
                            >
                                Submit Pairing
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-3 py-4"
                        >
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                                <Check className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm font-medium">Paired!</p>
                            <div className="flex flex-col gap-1">
                                {KEYS.map((key, ki) => (
                                    <span key={ki} className="text-xs text-muted-foreground">
                                        {key} → {VALUES[selections[ki]]}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-1">
                                See what everyone else matched after voting closes!
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
