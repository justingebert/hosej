"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CircleMinus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PairingKeySource, PairingMode } from "@/types/models/question";
import type { createQuestionData } from "@/types/create";

type PairingData = NonNullable<createQuestionData["pairing"]>;

interface PairingConfigProps {
    pairing: PairingData;
    memberNames: string[];
    onChange: (pairing: PairingData) => void;
}

export default function PairingConfig({ pairing, memberNames, onChange }: PairingConfigProps) {
    const isMembers = pairing.keySource === PairingKeySource.Members;
    const isOpen = pairing.mode === PairingMode.Open;

    const toggleKeySource = () => {
        onChange({
            ...pairing,
            keySource: isMembers ? PairingKeySource.Custom : PairingKeySource.Members,
            keys: isMembers ? [""] : memberNames,
        });
    };

    const toggleMode = () => {
        onChange({
            ...pairing,
            mode: isOpen ? PairingMode.Exclusive : PairingMode.Open,
        });
    };

    const updateList = (field: "keys" | "values", items: string[]) => {
        onChange({ ...pairing, [field]: items });
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <Label className="text-sm">Use group members</Label>
                <Switch checked={isMembers} onCheckedChange={toggleKeySource} />
            </div>

            <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Match these</Label>
                {isMembers ? (
                    <div className="flex flex-wrap gap-1.5">
                        {memberNames.map((name) => (
                            <span
                                key={name}
                                className="text-xs px-2.5 py-1 bg-secondary rounded-full"
                            >
                                {name}
                            </span>
                        ))}
                    </div>
                ) : (
                    <EditableList
                        items={pairing.keys || []}
                        placeholder="Item"
                        onChange={(items) => updateList("keys", items)}
                    />
                )}
            </div>

            <div>
                <Label className="text-xs text-muted-foreground mb-2 block">With these</Label>
                <EditableList
                    items={pairing.values}
                    placeholder="Choice"
                    onChange={(items) => updateList("values", items)}
                />
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-sm">Allow reuse</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {isOpen
                            ? "Same choice can match multiple items"
                            : "Each choice can only be used once"}
                    </p>
                </div>
                <Switch checked={isOpen} onCheckedChange={toggleMode} />
            </div>
        </div>
    );
}

const rollOutVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
};

function EditableList({
    items,
    placeholder,
    onChange,
}: {
    items: string[];
    placeholder: string;
    onChange: (items: string[]) => void;
}) {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const update = (index: number, value: string) => {
        const next = [...items];
        next[index] = value;
        onChange(next);
    };

    const add = () => {
        onChange([...items, ""]);
        setTimeout(() => inputRefs.current[items.length]?.focus(), 0);
    };

    const remove = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <>
            <AnimatePresence>
                {items.map((item, index) => (
                    <motion.div
                        key={index}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={rollOutVariants}
                        transition={{ duration: 0.3 }}
                        className="mt-2 flex justify-between gap-4"
                    >
                        <Input
                            type="text"
                            placeholder={`${placeholder} ${index + 1}`}
                            value={item}
                            onChange={(e) => update(index, e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    add();
                                }
                            }}
                            ref={(el) => {
                                inputRefs.current[index] = el;
                            }}
                            className="w-full"
                        />
                        <Button
                            className="p-2 flex items-center justify-center flex-shrink-0"
                            variant="secondary"
                            onClick={() => remove(index)}
                        >
                            <CircleMinus color={"red"} />
                        </Button>
                    </motion.div>
                ))}
            </AnimatePresence>
            <div className="flex justify-end mt-2">
                <Button variant="outline" size="icon" onClick={add}>
                    <Plus size={25} />
                </Button>
            </div>
        </>
    );
}
