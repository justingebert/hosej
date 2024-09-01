import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploaderProps {
  onImageReady: (compressedFile: File | null) => void;
  clearInput?: boolean;
  className?: string; 
  placeholder?: string; 
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageReady, clearInput, className, placeholder }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onImageReady(files[0]);
    }
  };

  useEffect(() => {
    if (clearInput && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [clearInput]);

  return (
    <div className={className}>
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        placeholder={placeholder} 
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUploader;
