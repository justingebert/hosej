"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import ImageUploader from "@/components/ImageUploader";
import { useImageUploader } from "@/hooks/useImageUploader";


function calcTimeLeft(endTime: Date) {
  const difference = +new Date(endTime) - +new Date();
  let timeLeft = {
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)).toString().padStart(2, '0'),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24).toString().padStart(2, '0'),
      minutes: Math.floor((difference / 1000 / 60) % 60).toString().padStart(2, '0'),
      seconds: Math.floor((difference / 1000) % 60).toString().padStart(2, '0'),
    };
  }

  return timeLeft;
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
  const { toast } = useToast();
  const { uploading, compressImages, handleImageUpload } = useImageUploader();

  // Set up a timer to update the countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(rally.endTime)); // Update the time left
    }, 1000);

    // Clean up the timer when the component is unmounted
    return () => clearInterval(timer);
  }, [rally.endTime]);

  useEffect(() => {
    if (clearImageInput) {
      setClearImageInput(false);
    }
  }, [clearImageInput]);

  const createRallySubmission = async (rallyId: string, groupId: string, userId: string, imageUrl: string) => {
    const response = await fetch(`/api/${groupId}/rally/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rallyId,
        userId,
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
      const imageUrl = await handleImageUpload(groupId, "rally", rally._id, user._id, [compressedMainImage]);
      if (imageUrl && imageUrl.length > 0) {
        await createRallySubmission(
          rally._id,
          rally.groupId,
          user.username,
          imageUrl[0]
        );
      }
      
      toast({ title: "Submission successful!" });
      setUserHasVoted((prev: any) => ({ ...prev, [rally._id]: true }));
      setUserHasUploaded((prev: any) => ({ ...prev, [rally._id]: true }));
      setUploadsCount((prevCount:any) => prevCount + 1); // Increase the uploads count
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
  <div className="text-center">
    <div className="mt-5 text-xs">
      {`${timeLeft.days}d:${timeLeft.hours}h:${timeLeft.minutes}m:${timeLeft.seconds}s left`}
    </div>
    <div className="mb-4">
      {uploadsCount} uploads
    </div>
  </div>

  {/* Middle Section: Image Uploader (centered) */}
  {userHasUploaded[rally._id] ? (
    <div className="text-center text-green-500 mb-4">
      You have already submitted an image.
    </div>
  ) : (
    <div className=""> {/* Flex-grow to expand in available space */}
      <ImageUploader
        onFileSelect={setFile}
        clearInput={clearImageInput}
        showFilename={true}
        className=""
        buttonstyle="w-full h-24"
      />
    </div>
  )}

  {/* Bottom Section: Submit Button */}
  <div className="text-center mt-4">
    {!userHasUploaded[rally._id] && (
      <Button onClick={handleSubmit} disabled={uploading || !file} className="w-full">
        {uploading ? "Submitting..." : "Submit"}
      </Button>
    )}
  </div>
</div>
  );
}
