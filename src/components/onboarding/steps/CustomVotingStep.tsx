"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const MOCK_QUESTION = "Best pizza topping?";
const MOCK_OPTIONS = ["Pepperoni", "Mushrooms", "Pineapple", "Margherita"];
const MOCK_RESULTS = [
    { option: "Pepperoni", pct: 42 },
    { option: "Mushrooms", pct: 25 },
    { option: "Pineapple", pct: 8 },
    { option: "Margherita", pct: 25 },
];

export function CustomVotingStep() {
    const [selected, setSelected] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    return (
        <div className="flex flex-col gap-4 py-2">
            <div>
                <h2 className="text-lg font-bold mb-1">Daily Questions</h2>
                <p className="text-sm text-muted-foreground">
                    Every day your group gets questions to vote on. Tap an option to try it!
                </p>
            </div>

            <div className="rounded-xl bg-secondary/30 p-4">
                <p className="font-semibold text-center mb-4">{MOCK_QUESTION}</p>

                <AnimatePresence mode="wait">
                    {!submitted ? (
                        <motion.div
                            key="vote"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col gap-3"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                {MOCK_OPTIONS.map((option) => (
                                    <Button
                                        key={option}
                                        variant={selected === option ? "default" : "secondary"}
                                        className="h-auto py-3 text-sm whitespace-normal"
                                        onClick={() => setSelected(option)}
                                    >
                                        {option}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                className="w-full mt-2"
                                disabled={!selected}
                                onClick={() => setSubmitted(true)}
                            >
                                Submit Vote
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col gap-2"
                        >
                            {MOCK_RESULTS.map((r) => (
                                <div key={r.option} className="flex items-center gap-2">
                                    <span className="text-xs w-20 truncate">{r.option}</span>
                                    <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary rounded-full flex items-center justify-end pr-2"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${r.pct}%` }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                        >
                                            <span className="text-[10px] font-bold text-primary-foreground">
                                                {r.pct}%
                                            </span>
                                        </motion.div>
                                    </div>
                                    {r.option === selected && (
                                        <Check className="h-4 w-4 text-primary shrink-0" />
                                    )}
                                </div>
                            ))}
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                See how your group voted in real-time!
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
