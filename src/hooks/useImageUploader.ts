import { useState } from "react";
import imageCompression from "browser-image-compression";

export const useImageUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [compressedImage, setCompressedImage] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, options);
    setCompressedImage(compressedFile);
    return compressedFile;
  };

  const getPresignedUrl = async (filename: string, contentType: string, groupId: string, entity:string,  entityId: string, userId:string) => {
    const response = await fetch(`/api/uploadimage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
        contentType,
        groupId,
        entity,
        entityId,
        userId
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

  const handleImageUpload = async (groupId:string, entity: string, entityId: string, userId:string) => {
    if (!compressedImage) return null;

    setUploading(true);
    try {
      const { url, fields } = await getPresignedUrl(compressedImage.name, compressedImage.type, groupId, entity, entityId, userId);
      const key = await uploadToS3(url, fields, compressedImage);
      const uploadedFileUrl = `${url}/${key}`;
      setFileUrl(uploadedFileUrl);
      return uploadedFileUrl;
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload file");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    compressedImage,
    fileUrl,
    compressImage,
    handleImageUpload,
  };
};
