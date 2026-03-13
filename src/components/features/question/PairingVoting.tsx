"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { QuestionWithUserStateDTO } from "@/types/models/question";

const PairingVoting = ({
    question,
    onVote,
}: {
    question: Pick<
        QuestionWithUserStateDTO,
        "_id" | "groupId" | "pairingKeys" | "pairingValues" | "pairingMode"
    >;
    onVote: () => void;
}) => {
    const keys = question.pairingKeys || [];
    const values = question.pairingValues || [];
    const isExclusive = question.pairingMode === "exclusive";

    const [selections, setSelections] = useState<Record<string, string>>({});

    const usedValues = isExclusive ? new Set(Object.values(selections)) : new Set<string>();

    const handleSelect = (key: string, value: string) => {
        setSelections((prev) => ({ ...prev, [key]: value }));
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

    return (
        <div className="flex flex-col">
            <div className="flex flex-col gap-3 pb-32">
                {keys.map((key) => (
                    <div key={key} className="flex items-center gap-3">
                        <span className="text-sm font-medium min-w-[80px] truncate">{key}</span>
                        <Select
                            value={selections[key] || ""}
                            onValueChange={(val) => handleSelect(key, val)}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                {values.map((value) => {
                                    const isUsed =
                                        isExclusive &&
                                        usedValues.has(value) &&
                                        selections[key] !== value;
                                    return (
                                        <SelectItem key={value} value={value} disabled={isUsed}>
                                            {value}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 w-full backdrop-blur-md pb-10 pt-4 px-6">
                <Button
                    onClick={() => allSelected && submitVote()}
                    disabled={!allSelected}
                    className="w-full h-12 text-lg font-bold"
                >
                    Submit
                </Button>
            </div>
        </div>
    );
};

export default PairingVoting;
