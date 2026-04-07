"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import ImageUploader from "@/components/common/ImageUploader";
import { useImageUploader } from "@/hooks/useImageUploader";
import { Progress } from "@/components/ui/progress";
import { Camera, CheckCircle2, Clock, Users } from "lucide-react";
import type { Session } from "next-auth";
import type { RallyDTO } from "@/types/models/rally";

function calcTimeLeft(endTime: string | Date) {
    const difference = +new Date(endTime) - +new Date();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
}

function calcTimeProgress(startTime: string | Date, endTime: string | Date) {
    const now = +new Date();
    const totalTime = +new Date(endTime) - +new Date(startTime);
    const timePassed = now - +new Date(startTime);

    if (timePassed < 0) return 0;
    if (timePassed >= totalTime) return 100;
    return (timePassed / totalTime) * 100;
}

interface SubmitRallyProps {
    rally: RallyDTO;
    groupId: string;
    user: Session["user"] | undefined;
    hasUploaded: boolean;
    onMutate: () => void;
}

export default function SubmitRally({
    rally,
    groupId,
    user,
    hasUploaded,
    onMutate,
}: SubmitRallyProps) {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [clearImageInput, setClearImageInput] = useState(false);
    const [timeLeft, setTimeLeft] = useState(calcTimeLeft(rally.submissionEnd!));
    const [progressValue, setProgressValue] = useState(0);
    const { toast } = useToast();
    const { uploading, compressImages, handleImageUpload } = useImageUploader();

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calcTimeLeft(rally.submissionEnd!));
            setProgressValue(calcTimeProgress(rally.startTime!, rally.submissionEnd!));
        }, 1000);
        return () => clearInterval(timer);
    }, [rally.startTime, rally.submissionEnd]);

    useEffect(() => {
        if (clearImageInput) setClearImageInput(false);
    }, [clearImageInput]);

    const handleSubmit = async () => {
        if (!file || !user) return;
        setLoading(true);
        try {
            const [compressedMainImage] = await compressImages([file]);
            const uploadResult = await handleImageUpload(groupId, "rally", rally._id, user._id, [
                compressedMainImage,
            ]);
            if (uploadResult && uploadResult.length > 0) {
                const res = await fetch(`/api/groups/${groupId}/rally/${rally._id}/submissions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageKey: uploadResult[0].key }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || "Submission failed");
                }
            }
            onMutate();
            toast({ title: "Submission successful!" });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Something went wrong";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const showDays = timeLeft.days > 0;

    return (
        <div className="flex flex-col grow justify-between mt-2 pb-20">
            {/* Timer section */}
            <div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">
                        Time remaining
                    </span>
                </div>
                <div className="flex justify-center gap-3 mb-3">
                    {showDays && <TimeUnit value={timeLeft.days} label="days" />}
                    <TimeUnit value={timeLeft.hours} label="hrs" />
                    <TimeUnit value={timeLeft.minutes} label="min" />
                    <TimeUnit value={timeLeft.seconds} label="sec" />
                </div>
                <Progress value={progressValue} className="h-2" />
            </div>

            {/* Upload section */}
            <div className="flex-1 flex flex-col items-center justify-center py-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                        <span className="font-semibold text-foreground">
                            {rally.submissions.length}
                        </span>{" "}
                        {rally.submissions.length === 1 ? "photo submitted" : "photos submitted"}
                    </span>
                </div>

                {hasUploaded ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-lg font-semibold">Photo submitted</p>
                        <p className="text-sm text-muted-foreground">
                            Voting starts when the timer ends
                        </p>
                    </div>
                ) : (
                    <div className="w-full">
                        <ImageUploader
                            onFileSelect={setFile}
                            clearInput={clearImageInput}
                            showFilename={true}
                            buttonstyle="w-full h-44 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors"
                            label="Tap to add photo"
                        />
                    </div>
                )}
            </div>

            {/* Fixed submit button at bottom */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-background pb-8">
                {hasUploaded ? (
                    <Button disabled className="w-full h-12 font-semibold text-base">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Submitted
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={uploading || !file || loading}
                        className="w-full h-12 font-semibold text-base"
                    >
                        <Camera className="h-5 w-5 mr-2" />
                        {uploading || loading ? "Submitting..." : "Submit Photo"}
                    </Button>
                )}
            </div>
        </div>
    );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-3xl font-bold tabular-nums leading-none">
                {value.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                {label}
            </span>
        </div>
    );
}
