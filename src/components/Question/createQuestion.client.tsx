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

const CreateQuestion = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { session, status, user } = useAuthRedirect();
  const [question, setQuestion] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [options, setOptions] = useState([""]);
  const { toast } = useToast();
  const [clearImageInput, setClearImageInput] = useState(false);

  const {
    compressedImage,  // This holds the compressed image file
    handleImageUpload,  // uploads the image when called
    uploading,          // indicates if the image is being uploaded
    compressImage       // compresses the image
  } = useImageUploader();

  useEffect(() => {
    if (clearImageInput) {
      setClearImageInput(false); // Reset the clearImageInput after it's triggered
    }
  }, [clearImageInput]);

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleOptionChange = (value: any, index: any) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handleRemoveOption = (index: any) => {
    const updatedOptions = options.filter((_, idx) => idx !== index);
    setOptions(updatedOptions);
  };

  const handleImageReady = async (file: File | null) => {
    if (file) {
      await compressImage(file);  // Compress the image when it's ready
    }
  };

  const resetForm = () => {
    setQuestion("");
    setOptions([""]);
    setQuestionType("");
    setClearImageInput(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (questionType.startsWith("custom") && options.length < 2) {
      alert("Please add at least two options for custom selections.");
      return;
    }

    const questionData = {
      groupId: groupId,
      category: "Daily",
      questionType: questionType,
      question: question,
      options: questionType.startsWith("custom") ? options : [],
      submittedBy: user.username,
    };

    try {

      const response = await fetch(`/api/${groupId}/question/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) throw new Error("Failed to create question");
      const {newQuestion} = await response.json();
      
      if (compressedImage) {
        const imageUrl = await handleImageUpload(groupId, "question", newQuestion._id, user._id); 

        if (imageUrl) {
          // Update the question with the image URL
          const response = await fetch(`/api/${groupId}/question/${newQuestion._id}/attachImage`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageUrl }),
          });
          if(!response.ok) throw new Error("Failed to attach image");
        }
      }
      toast({title: "Question created successfully!",});

      resetForm();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
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
          </SelectContent>
        </Select>
      </div>
      <div className="mt-5">
        <Input
          type="text"
          placeholder="Enter question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
      </div>

      <ImageUploader onImageReady={handleImageReady} clearInput={clearImageInput} className="my-5" placeholder="Upload your image here"/>
      {questionType.startsWith("custom") && (
        <>
          <div className="mt-5">
            {options.map((option, index) => (
              <div key={index} className="mt-2 flex w-full">
                <Input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(e.target.value, index)}
                />
                <Button
                  className="ml-2 w-10 p-2"
                  variant="destructive"
                  onClick={() => handleRemoveOption(index)}
                >
                  <Image src="/AppIcons/trash.svg" alt="Delete" width={20} height={20} />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-5">
            <Button variant="secondary" className="w-10" onClick={handleAddOption}>
              +
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
