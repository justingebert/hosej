"use client";
import React, { useState } from "react";
import imageCompression from 'browser-image-compression';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UploadComponentProps {
  onUpload: (fileUrl: string) => void;
  uploadPath: string; // e.g., 'question', 'rally', etc.
  modelId: string; // ID of the model to attach the file to
}

const UploadComponent: React.FC<UploadComponentProps> = ({ onUpload, uploadPath, modelId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const getPresignedUrl = async (filename: string, contentType: string) => {
    const response = await fetch(`/api/${uploadPath}/${modelId}/uploadimage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
        contentType,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Failed to get pre-signed URL: ${responseText}`);
    }

    return response.json();
  };

  const uploadToS3 = async (url: string, fields: Record<string, string>, file: File) => {
    const formData = new FormData();

    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append("file", file);

    const uploadResponse = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const responseText = await uploadResponse.text();
      throw new Error(`S3 Upload Error: ${responseText}`);
    }

    return fields.key; // Return the key to construct the image URL
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      const { url, fields } = await getPresignedUrl(compressedFile.name, compressedFile.type);
      const key = await uploadToS3(url, fields, compressedFile);
      const fileUrl = `${url}/${key}`;

      onUpload(fileUrl); // Trigger the callback to attach the file URL to the model
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Input type="file" accept="image/*" onChange={handleFileChange} />
      <Button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  );
};

export default UploadComponent;
