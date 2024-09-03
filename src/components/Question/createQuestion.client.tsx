"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUploader from "@/components/ImageUploader";
import { useImageUploader } from "@/hooks/useImageUploader";
import { useParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

const CreateQuestion = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { session, status, user } = useAuthRedirect();
  const [question, setQuestion] = useState("");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [questionType, setQuestionType] = useState("");
  const [options, setOptions] = useState<string[]>([""]);
  const [optionFiles, setOptionFiles] = useState<(File | null)[]>([]);
  const { toast } = useToast();
  const [clearImageInput, setClearImageInput] = useState(false);

  const {
    uploading,
    compressImages,
    handleImageUpload,
  } = useImageUploader();

  useEffect(() => {
    if (clearImageInput) {
      setClearImageInput(false);
    }
  }, [clearImageInput]);

  const handleAddOption = () => {
    setOptions([...options, ""]);
    setOptionFiles([...optionFiles, null]);
  };

  const handleOptionChange = (value: string, index: number) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = options.filter((_, idx) => idx !== index);
    const updatedOptionFiles = optionFiles.filter((_, idx) => idx !== index);
    setOptions(updatedOptions);
    setOptionFiles(updatedOptionFiles);
  };

  const handleOptionImageReady = (file: File | null, index: number) => {
    const updatedOptionFiles = [...optionFiles];
    updatedOptionFiles[index] = file;
    setOptionFiles(updatedOptionFiles);
  };

  const handleImageReady = async (file: File | null) => {
    if (file) {
      setMainImageFile(file); // Store the main image file for later use
    }
  };

  const resetForm = () => {
    setQuestion("");
    setOptions([""]);
    setOptionFiles([]);
    setQuestionType("");
    setClearImageInput(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (questionType.startsWith("custom") && options.length < 2) {
      alert("Please add at least two options for custom selections.");
      return;
    }

    if (questionType.startsWith("image-select") && options.length < 2) {
      alert("Please add at least two options for image selections.");
      return;
    }

    const questionData = {
      groupId: groupId,
      category: "Daily",
      questionType: questionType,
      question: question,
      options: questionType.startsWith("custom") ? options : [], // This will be populated after the image uploads
      submittedBy: user.username,
    };

    try {
      // Create the question without options first
      const response = await fetch(`/api/${groupId}/question/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) throw new Error("Failed to create question");
      const { newQuestion } = await response.json();

      // Upload the main image if there is one
      if (mainImageFile) {
        const [compressedMainImage] = await compressImages([mainImageFile]);
        const imageUrl = await handleImageUpload(groupId, "question", newQuestion._id, user._id, [compressedMainImage]);
        
        if (imageUrl && imageUrl.length > 0) {
          // Attach the main image to the question
          const response = await fetch(`/api/${groupId}/question/${newQuestion._id}/attachImage`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageUrl: imageUrl[0] }),
          });
          if (!response.ok) throw new Error("Failed to attach image");
        }
      }
      if(questionType === "image-select-one") {
          // Upload option images and update the options array
        const compressedFiles = await compressImages(optionFiles.filter(Boolean) as File[]);
        const optionImageUrls = await handleImageUpload(groupId, "question-option", newQuestion._id, user._id, compressedFiles);

        const updatedOptions = options.map((option, index) => {
          return (optionImageUrls as any)[index] || option;
        });

        // Update the question with options
        const res = await fetch(`/api/${groupId}/question/${newQuestion._id}/attachOptions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ options: updatedOptions }),
        });
        if (!res.ok) throw new Error("Failed to attach options");
      }
      

      toast({ title: "Question created successfully!" });
      resetForm();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const rollOutVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 }
  };

  return (
    <>
      <div className="mt-5">
        <Select value={questionType} onValueChange={setQuestionType}>
          <SelectTrigger>
            <SelectValue placeholder="Select Question Type" />
          </SelectTrigger>
          <SelectContent className="absolute z-50">
            <SelectItem value="users-select-one">Vote One User</SelectItem>
            <SelectItem value="custom-select-one">Vote One Custom Option</SelectItem>
            <SelectItem value="text">Text Reply</SelectItem>
            <SelectItem value="rating">Rating (1-10)</SelectItem>
            <SelectItem value="image-select-one">Vote One Custom Image</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-5 flex flex-row gap-4">
        <Input
          type="text"
          placeholder="Enter question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          className="w-full"
        />
        <ImageUploader
          onFileSelect={handleImageReady}
          clearInput={clearImageInput}
          showFilename={false}
          className="w-12 flex items-center justify-center"
        />
      </div>

      {questionType === "custom-select-one" && (
        <>
          <div className="mt-10 px-4">
            <AnimatePresence>
              {options.map((option, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={rollOutVariants}
                  transition={{ duration: 0.3 }}
                  className="mt-2 flex w-full items-center gap-4"
                >
                  <Input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(e.target.value, index)}
                    className="w-full"
                  />
                  <Button
                    className="w-14 p-2 flex items-center justify-center"
                    variant="secondary"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <Image src="/AppIcons/trash-red.svg" alt="Delete" width={25} height={25} />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex justify-end mt-2 px-4">
            <Button variant="ghost" className="w-12 p-2" onClick={handleAddOption}>
              <Plus size={25} />
            </Button>
          </div>
        </>
      )}

{questionType === "image-select-one" && (
        <>
          <div className="mt-10 px-4">
            <AnimatePresence>
              {options.map((_, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={rollOutVariants}
                  transition={{ duration: 0.3 }}
                  className="flex flex-row justify-between w-full items-center gap-4 mt-2"
                >
                  <ImageUploader
                    onFileSelect={(file) => handleOptionImageReady(file, index)}
                    clearInput={clearImageInput}
                    className="w-full"
                    showFilename={true}
                  />
                  <Button
                    className="w-14 p-2 flex items-center justify-center"
                    variant="secondary"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <Image src="/AppIcons/trash-red.svg" alt="Delete" width={25} height={25} />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex justify-end mt-2 px-4">
            <Button variant="ghost" className="w-12 p-2" onClick={handleAddOption}>
              <Plus size={25} />
            </Button>
          </div>
        </>
      )}
      <div className="flex justify-center fixed bottom-20 left-0 w-full p-2 bg-background">
        <Button onClick={handleSubmit} disabled={uploading || !question.trim()}>
          {uploading ? "Creating..." : "Create Question"}
        </Button>
      </div>
    </>
  );
};

export default CreateQuestion;
