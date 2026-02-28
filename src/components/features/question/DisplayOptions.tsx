"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CircleMinus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ImageUploader from "@/components/common/ImageUploader";

export type OptionsMode = "editable" | "image-editable" | "static";

interface DisplayOptionsProps {
    mode: OptionsMode;
    options: string[];
    clearInput: boolean;
    onOptionChange: (value: string, index: number) => void;
    onOptionRemove: (index: number) => void;
    onOptionAdd: () => void;
    onOptionImageAdded: (file: File | null, index: number) => void;
}

const rollOutVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
};

export const DisplayOptions = ({
    mode,
    options,
    clearInput,
    onOptionChange,
    onOptionRemove,
    onOptionAdd,
    onOptionImageAdded,
}: DisplayOptionsProps) => {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    if (mode === "static") {
        return (
            <AnimatePresence>
                {options.map((option, index) => (
                    <motion.div
                        key={index}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={rollOutVariants}
                        transition={{ duration: 0.3 }}
                        className="mt-2 flex w-full items-center gap-4"
                    >
                        <Input value={option} disabled={true} className="w-full" />
                    </motion.div>
                ))}
            </AnimatePresence>
        );
    }

    return (
        <>
            <AnimatePresence>
                {options.map((option, index) => (
                    <motion.div
                        key={index}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={rollOutVariants}
                        transition={{ duration: 0.3 }}
                        className="mt-2 flex justify-between gap-4"
                    >
                        {mode === "editable" && (
                            <Input
                                type="text"
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => onOptionChange(e.target.value, index)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        onOptionAdd();
                                        setTimeout(() => {
                                            inputRefs.current[options.length]?.focus();
                                        }, 0);
                                    }
                                }}
                                ref={(el) => {
                                    inputRefs.current[index] = el;
                                }}
                                className="w-full"
                            />
                        )}
                        {mode === "image-editable" && (
                            <ImageUploader
                                onFileSelect={(file) => onOptionImageAdded(file, index)}
                                clearInput={clearInput}
                                className="flex-1 min-w-0"
                                showFilename={true}
                                buttonstyle="flex-1 items-center justify-between w-full p-3"
                            />
                        )}
                        <Button
                            className="p-2 flex items-center justify-center flex-shrink-0"
                            variant="secondary"
                            onClick={() => onOptionRemove(index)}
                        >
                            <CircleMinus color={"red"} />
                        </Button>
                    </motion.div>
                ))}
            </AnimatePresence>
            <div className="flex justify-end mt-2">
                <Button variant="outline" size="icon" onClick={onOptionAdd}>
                    <Plus size={25} />
                </Button>
            </div>
        </>
    );
};
