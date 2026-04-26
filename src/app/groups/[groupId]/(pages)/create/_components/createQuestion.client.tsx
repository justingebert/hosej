"use client";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ImageUploader from "@/components/common/ImageUploader";
import { useImageUploader } from "@/hooks/useImageUploader";
import { useParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useToast } from "@/hooks/use-toast";
import type { createQuestionData } from "@/types/create";
import { PairingKeySource, PairingMode } from "@/types/models/question";
import useSWR from "swr";
import type { GroupDTO } from "@/types/models/group";
import fetcher from "@/lib/fetcher";
import type { OptionsMode } from "../../../question/_components/DisplayOptions";
import { DisplayOptions } from "../../../question/_components/DisplayOptions";
import PairingConfig from "../../../question/_components/PairingConfig";
import { Info } from "lucide-react";
import { QuestionTypesInfo } from "@/app/groups/[groupId]/(pages)/create/_components/questionTypesInfo";
import { Textarea } from "@/components/ui/textarea";

interface CreateQuestionProps {
    questionData: createQuestionData;
    setQuestionData: React.Dispatch<React.SetStateAction<createQuestionData>>;
}

type UploadedFileData = { key: string; url: string };

const CreateQuestion = ({ questionData, setQuestionData }: CreateQuestionProps) => {
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    const { user } = useAuthRedirect();
    const { toast } = useToast();
    const [showInfo, setShowInfo] = useState(false);
    const [clearImageInput, setClearImageInput] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { uploading, compressImages, handleImageUpload } = useImageUploader();

    let optionsMode: OptionsMode;
    if (questionData.questionType === "custom") {
        optionsMode = "editable";
    } else if (questionData.questionType === "image") {
        optionsMode = "image-editable";
    } else {
        optionsMode = "static";
    }

    const { data: group, isLoading } = useSWR<GroupDTO>(
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

    const showMultiSelectToggle = ["users", "custom", "image"].includes(questionData.questionType);
    const isPairing = questionData.questionType === "pairing";

    const handleTypeSelect = (value: string) => {
        if (value === "users") {
            setQuestionData((prev) => ({
                ...prev,
                questionType: value,
                multiSelect: false,
                options: group?.members.map((member) => member.name) || [],
                optionFiles: [],
                pairing: undefined,
            }));
        } else if (value === "custom") {
            setQuestionData((prev) => ({
                ...prev,
                questionType: value,
                multiSelect: false,
                options: [""],
                optionFiles: [],
                pairing: undefined,
            }));
        } else if (value === "image") {
            setQuestionData((prev) => ({
                ...prev,
                questionType: value,
                multiSelect: false,
                options: ["", ""],
                optionFiles: [null, null],
                pairing: undefined,
            }));
        } else if (value === "rating") {
            setQuestionData((prev) => ({
                ...prev,
                questionType: value,
                multiSelect: false,
                options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
                optionFiles: [],
                pairing: undefined,
            }));
        } else if (value === "pairing") {
            setQuestionData((prev) => ({
                ...prev,
                questionType: value,
                multiSelect: false,
                options: [],
                optionFiles: [],
                pairing: {
                    keySource: PairingKeySource.Members,
                    mode: PairingMode.Exclusive,
                    keys: group?.members.map((member) => member.name) || [],
                    values: [""],
                },
            }));
        } else {
            // text
            setQuestionData((prev) => ({
                ...prev,
                questionType: value,
                multiSelect: false,
                options: [],
                optionFiles: [],
                pairing: undefined,
            }));
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
            multiSelect: false,
            options: [],
            mainImageFile: null,
            optionFiles: [],
            pairing: undefined,
        });
        setClearImageInput(true);
    };

    const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
        setIsSubmitting(true);
        e.preventDefault();

        const trimmedOptions = questionData.options
            .map((option) => option.trim())
            .filter((option) => option !== "");

        const trimmedOptionsFiles = questionData.optionFiles.filter(
            (file): file is File => file !== null
        );

        if (questionData.questionType === "custom" && trimmedOptions.length < 2) {
            toast({
                title: "Please add at least two options for custom selections.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

        if (questionData.questionType === "image" && trimmedOptionsFiles.length < 2) {
            toast({
                title: "Please add at least two options for image selections.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

        if (isPairing) {
            const trimmedValues = (questionData.pairing?.values || []).filter(
                (v) => v.trim() !== ""
            );
            const trimmedKeys = (questionData.pairing?.keys || []).filter((k) => k.trim() !== "");
            if (trimmedValues.length < 2) {
                toast({
                    title: 'Please add at least two choices under "With these".',
                    variant: "destructive",
                });
                setIsSubmitting(false);
                return;
            }
            if (
                questionData.pairing?.keySource === PairingKeySource.Custom &&
                trimmedKeys.length < 2
            ) {
                toast({
                    title: 'Please add at least two items under "Match these".',
                    variant: "destructive",
                });
                setIsSubmitting(false);
                return;
            }
            if (
                questionData.pairing?.mode === PairingMode.Exclusive &&
                trimmedValues.length < trimmedKeys.length
            ) {
                toast({
                    title: "Without reuse, you need at least as many choices as items to match.",
                    variant: "destructive",
                });
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const tempEntityId = crypto.randomUUID();

            let mainImageKey: string | undefined;
            if (questionData.mainImageFile) {
                const [compressedMainImage] = await compressImages([questionData.mainImageFile]);
                const uploaded = await handleImageUpload(
                    groupId,
                    "question",
                    tempEntityId,
                    user!._id,
                    [compressedMainImage]
                );
                if (!uploaded || uploaded.length === 0) {
                    toast({ title: "Failed to upload image", variant: "destructive" });
                    setIsSubmitting(false);
                    return;
                }
                mainImageKey = uploaded[0].key;
            }

            let optionImageData: UploadedFileData[] = [];
            if (questionData.questionType === "image") {
                const compressedFiles = await compressImages(trimmedOptionsFiles);
                const uploaded = (await handleImageUpload(
                    groupId,
                    "question-option",
                    tempEntityId,
                    user!._id,
                    compressedFiles
                )) as UploadedFileData[] | null;
                if (!uploaded || uploaded.length === 0) {
                    toast({ title: "Failed to upload option images", variant: "destructive" });
                    setIsSubmitting(false);
                    return;
                }
                optionImageData = uploaded;
            }

            const questionPayload: Record<string, unknown> = {
                groupId: groupId,
                category: "Daily",
                questionType: questionData.questionType,
                question: questionData.question,
                multiSelect: questionData.multiSelect,
                options:
                    questionData.questionType === "custom"
                        ? trimmedOptions
                        : questionData.questionType === "image"
                          ? optionImageData
                          : [],
                submittedBy: user!._id,
            };

            if (mainImageKey) {
                questionPayload.image = mainImageKey;
            }

            if (isPairing && questionData.pairing) {
                questionPayload.pairing = {
                    keySource: questionData.pairing.keySource,
                    mode: questionData.pairing.mode,
                    keys: (questionData.pairing.keys || [])
                        .map((k) => k.trim())
                        .filter((k) => k !== ""),
                    values: (questionData.pairing.values || [])
                        .map((v) => v.trim())
                        .filter((v) => v !== ""),
                };
            }

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

            resetForm();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="mt-5">
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowInfo(true)}>
                        <Info className="h-4 w-4" />
                    </Button>
                    <Select value={questionData.questionType} onValueChange={handleTypeSelect}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Question Type" />
                        </SelectTrigger>
                        <SelectContent className="absolute z-50">
                            <SelectItem value="users">Vote Users</SelectItem>
                            <SelectItem value="custom">Vote Custom Options</SelectItem>
                            <SelectItem value="text">Text Reply</SelectItem>
                            <SelectItem value="rating">Rating (1-10)</SelectItem>
                            <SelectItem value="image">Vote Custom Images</SelectItem>
                            <SelectItem value="pairing">Pairing</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="mt-5">
                <Textarea
                    placeholder="Enter question"
                    value={questionData.question}
                    onChange={(e) =>
                        setQuestionData((prev) => ({ ...prev, question: e.target.value }))
                    }
                    required
                    className="w-full"
                />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                <ImageUploader
                    onFileSelect={handleMainImageAdded}
                    clearInput={clearImageInput}
                    showFilename={false}
                    className="flex items-center"
                    buttonstyle="flex items-center gap-2 text-sm text-muted-foreground"
                    label="Add image"
                />
                {showMultiSelectToggle && (
                    <div className="flex items-center gap-2 bg-secondary p-2 rounded-2xl">
                        <Switch
                            id="multi-select"
                            checked={questionData.multiSelect}
                            onCheckedChange={(checked) =>
                                setQuestionData((prev) => ({ ...prev, multiSelect: checked }))
                            }
                        />
                        <Label htmlFor="multi-select" className="text-sm text-muted-foreground">
                            Allow multi select
                        </Label>
                    </div>
                )}
            </div>

            {isPairing ? (
                <div
                    ref={optionsContainerRef}
                    className="mt-4 px-4 overflow-y-auto"
                    style={{ maxHeight: availableHeight ? `${availableHeight}px` : "auto" }}
                >
                    <PairingConfig
                        pairing={questionData.pairing!}
                        memberNames={group?.members.map((m) => m.name) || []}
                        onChange={(pairing) => setQuestionData((prev) => ({ ...prev, pairing }))}
                    />
                </div>
            ) : (
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
            )}

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
            <QuestionTypesInfo open={showInfo} onOpenChange={setShowInfo} />
        </>
    );
};

export default CreateQuestion;
