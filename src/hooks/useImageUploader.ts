import { useState } from "react";
import imageCompression from "browser-image-compression";

export const useImageUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [compressedImages, setCompressedImages] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);

  // Compress a single image or an array of images
  const compressImages = async (files: File[]) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    const compressedFiles = await Promise.all(files.map(file => imageCompression(file, options)));
    setCompressedImages(compressedFiles);
    return compressedFiles;
  };

  const getPresignedUrl = async (filename: string, contentType: string, groupId: string, entity: string, entityId: string, userId: string) => {
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
        userId,
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

  // Handle upload for one or multiple images
  const handleImageUpload = async (groupId: string, entity: string, entityId: string, userId: string, files: File[] = compressedImages) => {
    if (!files.length) return null;

    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const { url, fields } = await getPresignedUrl(file.name, file.type, groupId, entity, entityId, userId);
          const key = await uploadToS3(url, fields, file);
          return `${url}/${key}`;
        })
      );
      setFileUrls(urls);
      return urls;
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload file(s)");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    compressedImages,
    fileUrls,
    compressImages,
    handleImageUpload,
  };
};
