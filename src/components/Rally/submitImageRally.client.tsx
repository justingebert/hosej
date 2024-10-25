"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import ImageUploader from "@/components/ImageUploader";
import { useImageUploader } from "@/hooks/useImageUploader";
import { Progress } from "../ui/progress";

// Helper function to calculate time left
function calcTimeLeft(endTime: Date) {
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
function calcTimeProgress(startTime: Date, endTime: Date) {
  const now = +new Date();
  const totalTime = +new Date(endTime) - +new Date(startTime);
  const timePassed = now - +new Date(startTime);

  if (timePassed < 0) return 0; // If before the start time, 0% progress
  if (timePassed >= totalTime) return 100; // If the rally has ended, 100% progress

  return (timePassed / totalTime) * 100;
}

export default function SubmitRally({
  rally,
  groupId,
  user,
  userHasUploaded,
  setUserHasUploaded,
  setUserHasVoted,
}: any) {
  const [file, setFile] = useState<File | null>(null);
  const [clearImageInput, setClearImageInput] = useState(false);
  const [uploadsCount, setUploadsCount] = useState(rally.submissions.length); // Track uploads count
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft(rally.endTime)); // State for time left
  const [progressValue, setProgressValue] = useState(0); // Progress bar value
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

  const createRallySubmission = async (
    rallyId: string,
    groupId: string,
    imageUrl: string
  ) => {
    const response = await fetch(`/api/groups/${groupId}/rally/${rallyId}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
      }),
    });

    if (!response.ok) {
      const responseText = await response.json();
      throw new Error(`Submission failed: ${responseText}`);
    }

    return response.json();
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    try {
      const [compressedMainImage] = await compressImages([file]);
      const imageUrl = await handleImageUpload(
        groupId,
        "rally",
        rally._id,
        user._id,
        [compressedMainImage]
      );
      if (imageUrl && imageUrl.length > 0) {
        await createRallySubmission(
          rally._id,
          rally.groupId,
          imageUrl[0]
        );
      }

      toast({ title: "Submission successful!" });
      setUserHasVoted((prev: any) => ({ ...prev, [rally._id]: true }));
      setUserHasUploaded((prev: any) => ({ ...prev, [rally._id]: true }));
      setUploadsCount((prevCount: any) => prevCount + 1); // Increase the uploads count
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col grow justify-between">
      {/* Top Section: Time Left */}
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
        <div className="mb-4 mt-2">
          {/* Progress bar showing the time progress */}
          <Progress value={progressValue} />
        </div>
      </div>

      {/* Middle Section: Image Uploader (centered) */}
      <div>
        {userHasUploaded[rally._id] ? (
          <div className="border rounded-lg text-center text-green-500 h-40 flex items-center justify-center text-2xl font-bold">
            Already submitted
          </div>
        ) : (
          <ImageUploader
            onFileSelect={setFile}
            clearInput={clearImageInput}
            showFilename={true}
            className=""
            buttonstyle="w-full h-40"
          />
        )}
      </div>
      {/* Bottom Section: Submit Button */}
      <div className="text-center mt-4">
        <div className="">
          <div className="mb-5 text-m text-muted text-center">
            <span className="font-bold">{uploadsCount}</span>
            <span> uploads</span>
          </div>
        </div>
        {!userHasUploaded[rally._id] && (
          <Button
            onClick={handleSubmit}
            disabled={uploading || !file}
            className="w-full"
          >
            {uploading ? "Submitting..." : "Submit"}
          </Button>
        )}
      </div>
    </div>
  );
}
