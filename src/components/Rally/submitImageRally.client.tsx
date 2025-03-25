"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import ImageUploader from "@/components/ImageUploader";
import { useImageUploader } from "@/hooks/useImageUploader";
import { Progress } from "../ui/progress";
import { IUserJson } from "@/types/models";
import { createRallySubmissionRequest, RallyWithUserState } from "@/types/api";
import { mutate } from "swr";

function calcTimeLeft(endTime: Date | null) {
    if (!endTime) return { days: "00", hours: "00", minutes: "00", seconds: "00" };
    const difference = +new Date(endTime) - +new Date();
    let timeLeft = {
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
    };

    if (difference > 0) {
        timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24))
                .toString()
                .padStart(2, "0"),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24)
                .toString()
                .padStart(2, "0"),
            minutes: Math.floor((difference / 1000 / 60) % 60)
                .toString()
                .padStart(2, "0"),
            seconds: Math.floor((difference / 1000) % 60)
                .toString()
                .padStart(2, "0"),
        };
    }

    return timeLeft;
}

// Helper function to calculate the percentage of time passed
function calcTimeProgress(startTime: Date | null, endTime: Date | null) {
    if (!startTime || !endTime) return 0;

    const now = +new Date();
    const totalTime = +new Date(endTime) - +new Date(startTime);
    const timePassed = now - +new Date(startTime);

    if (timePassed < 0) return 0;
    if (timePassed >= totalTime) return 100;

    return (timePassed / totalTime) * 100;
}

export default function SubmitRally({
    rally,
    groupId,
    user,
}: {
    rally: RallyWithUserState;
    groupId: string;
    user: IUserJson;
}) {
    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [clearImageInput, setClearImageInput] = useState(false);
    const [timeLeft, setTimeLeft] = useState(calcTimeLeft(rally.endTime));
    const [progressValue, setProgressValue] = useState(0);
    const { toast } = useToast();
    const { uploading, compressImages, handleImageUpload } = useImageUploader();

    // Set up a timer to update the countdown and progress every second
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calcTimeLeft(rally.endTime)); // Update the time left
            setProgressValue(calcTimeProgress(rally.startTime, rally.endTime)); // Update the progress bar
        }, 1000);

        // Clean up the timer when the component is unmounted
        return () => clearInterval(timer);
    }, [rally.startTime, rally.endTime]);

    useEffect(() => {
        if (clearImageInput) {
            setClearImageInput(false);
        }
    }, [clearImageInput]);

    const createRallySubmission = async (rallyId: string, groupId: string, imageUrl: string) => {

        const req: createRallySubmissionRequest = {
            imageUrl,
        };

        const response = await fetch(`/api/groups/${groupId}/rally/${rallyId}/submissions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
        });

        if (!response.ok) {
            toast({
                title: "Error",
                description: "Failed to submit image",
                variant: "destructive",
            });
        }
        toast({
            title: "Success",
            description: "Image submitted successfully",
        });
    };

    const handleSubmit = async () => {
        if (!file) {
            alert("Please select a file to upload.");
            return;
        }
        setSubmitting(true);
        try {
            const [compressedMainImage] = await compressImages([file]);
            const imageUrl = await handleImageUpload(groupId, "rally", rally._id, user._id, [compressedMainImage]);
            if (imageUrl && imageUrl.length > 0) {
                await createRallySubmission(rally._id, rally.groupId, imageUrl[0].url);
            }
            mutate(`/api/groups/${groupId}/rally/`);
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col grow justify-between">
            <div>
                <div className="mt-5 text-sm  text-center">
                    <span className="text-2xl font-bold">{timeLeft.days}</span>
                    <span>d</span>
                    <span className="text-2xl font-bold">{timeLeft.hours}</span>
                    <span>hr</span>
                    <span className="text-2xl font-bold">{timeLeft.minutes}</span>
                    <span>min</span>
                    <span className="text-2xl font-bold">{timeLeft.seconds}</span>
                    <span>s</span>
                </div>
                <div className="mt-2">
                    <Progress value={progressValue} />
                </div>
            </div>

            <div className="mb-20">
                <div className="mb-4 text-m text-center">
                    <span className="font-bold">{rally.submissions.length}</span>
                    <span> uploads</span>
                </div>
                {rally.userHasUploaded ? (
                    <div className="border rounded-lg text-center text-green-500 h-40 flex items-center justify-center text-2xl font-bold">
                        Already submitted
                    </div>
                ) : (
                    <ImageUploader
                        onFileSelect={setFile}
                        clearInput={clearImageInput}
                        showFilename={true}
                        buttonstyle="w-full h-40"
                    />
                )}
            </div>

            <div className="text-center">
                <Button
                    onClick={handleSubmit}
                    disabled={rally.userHasUploaded || uploading || !file || submitting}
                    className="w-full h-12 font-bold text-lg"
                >
                    {uploading ? "Submitting..." : "Submit"}
                </Button>
            </div>
        </div>
    );
}
