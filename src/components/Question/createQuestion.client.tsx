"use client";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ImageUploader from "@/components/ImageUploader";
import { useImageUploader } from "@/hooks/useImageUploader";
import { useParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useToast } from "@/hooks/use-toast";
import { CircleMinus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createQuestionData } from "@/app/groups/[groupId]/(pages)/create/page";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { getGroupResponse } from "@/types/api";

interface CreateQuestionProps {
    questionData: createQuestionData;
    setQuestionData: React.Dispatch<React.SetStateAction<createQuestionData>>;
}

const CreateQuestion = ({ questionData, setQuestionData }: CreateQuestionProps) => {
    const params = useParams<{ groupId: string }>();
    const groupId = params? params.groupId : "";
    const { user } = useAuthRedirect();
    const { toast } = useToast();
    const [clearImageInput, setClearImageInput] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { uploading, compressImages, handleImageUpload } = useImageUploader();

    let optionsMode: OptionsMode;
    if (questionData.questionType.startsWith("custom")) {
        optionsMode = "editable";
    } else if (questionData.questionType.startsWith("image-select")) {
        optionsMode = "image-editable";
    } else {
        optionsMode = "static";
    }

    const { data: groupData } = useSWR<getGroupResponse>(
        user ? `/api/groups/${groupId}` : null,
        fetcher
    );

    useEffect(() => {
        if (clearImageInput) {
            setClearImageInput(false);
        }
    }, [clearImageInput]);

    // Calculate available height between options container and button
    useEffect(() => {
        const calculateAvailableHeight = () => {
            if (optionsContainerRef.current && buttonRef.current) {
                const buttonTop = buttonRef.current.getBoundingClientRect().top;
                const optionsTop = optionsContainerRef.current.getBoundingClientRect().top;
                const newAvailableHeight = buttonTop - optionsTop - 20; // 20px for padding/margin
                setAvailableHeight(newAvailableHeight);
            }
        };

        calculateAvailableHeight();
        window.addEventListener("resize", calculateAvailableHeight);

        return () => {
            window.removeEventListener("resize", calculateAvailableHeight);
        };
    }, []);

    // Refs and state for dynamic height calculation
    const [availableHeight, setAvailableHeight] = useState<number | null>(null);
    const optionsContainerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    const handleTypeSelect = (value: string) => {
        if (value.startsWith("users")) {
            setQuestionData((prev) => ({
                ...prev,
                questionType: value,
                options: groupData?.group.members.map((member) => member.name) || [],
            }));
        } else if (value.startsWith("custom") || value.startsWith("image")) {
            setQuestionData((prev) => ({ ...prev, questionType: value, options: [""] }));
        } else {
            setQuestionData((prev) => ({ ...prev, questionType: value, options: [] }));
        }
    };

    const handleAddOption = () => {
        setQuestionData((prev) => ({
            ...prev,
            options: [...prev.options, ""],
            optionFiles: [...prev.optionFiles, null],
        }));
    };

    const handleOptionChange = (value: string, index: number) => {
        setQuestionData((prev) => {
            const updatedOptions = [...prev.options];
            updatedOptions[index] = value;
            return { ...prev, options: updatedOptions };
        });
    };

    const handleRemoveOption = (index: number) => {
        setQuestionData((prev) => ({
            ...prev,
            options: prev.options.filter((_, idx) => idx !== index),
            optionFiles: prev.optionFiles.filter((_, idx) => idx !== index),
        }));
    };

    const handleOptionImageAdded = (file: File | null, index: number) => {
        setQuestionData((prev) => {
            const updatedOptionFiles = [...prev.optionFiles];
            updatedOptionFiles[index] = file;
            return { ...prev, optionFiles: updatedOptionFiles };
        });
    };

    const handleMainImageAdded = (file: File | null) => {
        setQuestionData((prev) => ({ ...prev, mainImageFile: file }));
    };

    const resetForm = () => {
        setQuestionData({
            question: "",
            questionType: "",
            options: [],
            mainImageFile: null,
            optionFiles: [],
        });
        setClearImageInput(true);
    };

    const handleSubmit = async (e: any) => {
        setIsSubmitting(true);
        e.preventDefault();

        const trimmedOptions = questionData.options
            .map((option) => option.trim())
            .filter((option) => option !== "");

        if (questionData.questionType.startsWith("custom") && trimmedOptions.length < 2) {
            toast({
                title: "Please add at least two options for custom selections.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

        if (questionData.questionType.startsWith("image-select") && trimmedOptions.length < 2) {
            toast({
                title: "Please add at least two options for image selections.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

        const questionPayload = {
            groupId: groupId,
            category: "Daily",
            questionType: questionData.questionType,
            question: questionData.question,
            options: questionData.questionType.startsWith("custom") ? trimmedOptions : [],
            submittedBy: user._id,
        };

        try {
            // Create the question without options first
            const response = await fetch(`/api/groups/${groupId}/question/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(questionPayload),
            });

            if (!response.ok) {
                toast({ title: "Failed to create question", variant: "destructive" });
                setIsSubmitting(false);
                return;
            }
            const { newQuestion } = await response.json();

            // Upload the main image if there is one
            if (questionData.mainImageFile) {
                const [compressedMainImage] = await compressImages([questionData.mainImageFile]);
                const imageUrl = await handleImageUpload(
                    groupId,
                    "question",
                    newQuestion._id,
                    user._id,
                    [compressedMainImage]
                );

                if (imageUrl && imageUrl.length > 0) {
                    // Attach the main image to the question
                    const response = await fetch(
                        `/api/groups/${groupId}/question/${newQuestion._id}/attachImage`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ imageUrl: imageUrl[0].url }),
                        }
                    );
                    if (!response.ok) {
                        toast({ title: "Failed to create question", variant: "destructive" });
                        //TODO delte question
                        setIsSubmitting(false);
                        return;
                    }
                }
            }

            if (
                questionData.questionType === "image-select-one" ||
                questionData.questionType === "image-select-multiple"
            ) {
                // Upload option images and update the options array
                const compressedFiles = await compressImages(
                    questionData.optionFiles.filter(Boolean) as File[]
                );
                const optionImageUrls = await handleImageUpload(
                    groupId,
                    "question-option",
                    newQuestion._id,
                    user._id,
                    compressedFiles
                );

                const updatedOptions = questionData.options.map((option, index) => {
                    return (optionImageUrls as any)[index] || option;
                });

                // Update the question with options
                const res = await fetch(
                    `/api/groups/${groupId}/question/${newQuestion._id}/attachOptions`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ options: updatedOptions }),
                    }
                );
                if (!res.ok) {
                    toast({ title: "Failed to create question", variant: "destructive" });
                    setIsSubmitting(false);
                    return;
                }
            }

            resetForm();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="mt-5">
                <Select value={questionData.questionType} onValueChange={handleTypeSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Question Type" />
                    </SelectTrigger>
                    <SelectContent className="absolute z-50">
                        <SelectItem value="users-select-one">Vote One User</SelectItem>
                        <SelectItem value="users-select-multiple">Vote Multiple Users</SelectItem>
                        <SelectItem value="custom-select-one">Vote One Custom Option</SelectItem>
                        <SelectItem value="custom-select-multiple">
                            Vote Multiple Custom Options
                        </SelectItem>
                        <SelectItem value="text">Text Reply</SelectItem>
                        <SelectItem value="rating">Rating (1-10)</SelectItem>
                        <SelectItem value="image-select-one">Vote One Custom Image</SelectItem>
                        <SelectItem value="image-select-multiple">
                            Vote Multiple Custom Images
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="mt-5 flex flex-row gap-4">
                <Input
                    type="text"
                    placeholder="Enter question"
                    value={questionData.question}
                    onChange={(e) =>
                        setQuestionData((prev) => ({ ...prev, question: e.target.value }))
                    }
                    required
                    className="w-full"
                />
                <ImageUploader
                    onFileSelect={handleMainImageAdded}
                    clearInput={clearImageInput}
                    showFilename={false}
                    className="w-12 flex items-center justify-center"
                    buttonstyle="flex items-center justify-between w-full p-3"
                />
            </div>
            <div
                ref={optionsContainerRef}
                className="mt-4 px-4 overflow-y-auto"
                style={{ maxHeight: availableHeight ? `${availableHeight}px` : "auto" }}
            >
                <DisplayOptions
                    mode={optionsMode}
                    options={questionData.options}
                    clearInput={clearImageInput}
                    onOptionChange={handleOptionChange}
                    onOptionRemove={handleRemoveOption}
                    onOptionAdd={handleAddOption}
                    onOptionImageAdded={handleOptionImageAdded}
                />
            </div>

            <div
                ref={buttonRef}
                className="flex justify-center fixed bottom-6 left-0 w-full p-6 bg-background mb-16"
            >
                <Button
                    onClick={handleSubmit}
                    disabled={
                        uploading ||
                        isSubmitting ||
                        !questionData.question.trim() ||
                        !questionData.questionType
                    }
                    className="h-12 w-full"
                >
                    {uploading || isSubmitting ? "Creating..." : "Create Question"}
                </Button>
            </div>
        </>
    );
};

export default CreateQuestion;

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
                                        // Wait for the new option to render.
                                        setTimeout(() => {
                                            inputRefs.current[options.length]?.focus();
                                        }, 0);
                                    }
                                }}
                                // Assign a ref for focusing later.
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
