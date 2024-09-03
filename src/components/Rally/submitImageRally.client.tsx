"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {Button} from "@/components/ui/button";
import ImageUploader from "@/components/ImageUploader";
import { useImageUploader } from "@/hooks/useImageUploader";


// Helper function to calculate time left
function calcTimeLeft(endTime: Date): any {
    const difference = +new Date(endTime) - +new Date();
    let timeLeft = {};
  
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
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
  const { toast } = useToast();
  const { uploading, compressImages, handleImageUpload } = useImageUploader();

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="mt-5 text-xs text-center">
        {calcTimeLeft(rally.endTime).days}d{" "}
        {calcTimeLeft(rally.endTime).hours}h left
      </div>
      {userHasUploaded[rally._id] ? (
        <div className="text-center text-green-500 mb-4">
          You have already submitted an image.
        </div>
      ) : (
        <div>
          <ImageUploader
            onFileSelect={setFile}
            clearInput={clearImageInput}
            showFilename={true}
            className=""
          />
          <div className="flex justify-center">
          <Button onClick={handleSubmit} disabled={uploading || !file}>
            {uploading ? "Submitting..." : "Submit"}
          </Button>
          </div>
        </div>
      )}
      <div className="absolute bottom-5 left-0 right-0 text-center">
        {rally.submissions.length} uploads
      </div>
    </div>
  );
}

