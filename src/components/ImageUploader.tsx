import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { X, ImagePlus } from 'lucide-react';

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  clearInput?: boolean;
  className?: string;
  placeholder?: string;
  showFilename?: boolean;
  buttonstyle?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, clearInput, showFilename, className, buttonstyle }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null); // State to hold the selected file name

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFileName(files[0].name); // Set the file name when a file is selected
      onFileSelect(files[0]); // Pass the selected file to the parent component
    }
  };

  const handleRemoveFile = () => {
    setSelectedFileName(null);
    onFileSelect(null); // Notify parent that the file has been removed
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
    }
  };

  useEffect(() => {
    if (clearInput && fileInputRef.current) {
      fileInputRef.current.value = '';
      setSelectedFileName(null); // Clear the selected file name when input is cleared
    }
  }, [clearInput]);

  return (
    <div className={className}>
    <Button 
      onClick={() => {
        if (selectedFileName) {
          handleRemoveFile();
        } else {
          fileInputRef.current?.click();
        }
      }}
      className={buttonstyle} 
      variant={"secondary"}
    >
      {selectedFileName ? (
        showFilename ? (
          <div className="flex items-center w-full min-w-0">
            <span className="flex-1 truncate min-w-0">
              {selectedFileName}
            </span>
            <div className="flex-shrink-0 ml-2">
              <X color="red" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <X color="red" />
          </div>
        )
      ) : (
        <ImagePlus />
      )}
    </Button>
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default ImageUploader;
