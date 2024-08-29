"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { IUser } from "@/db/models/user";



const CreateQuestion = () => {
  const { session, status, user } = useAuthRedirect();
  const [question, setQuestion] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [options, setOptions] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<String>("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const { groupId } = useParams<{ groupId: string }>();

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleOptionChange = (value:any, index:any) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handleRemoveOption = (index:any) => {
    const updatedOptions = options.filter((_, idx) => idx !== index);
    setOptions(updatedOptions);
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (questionType.startsWith("custom") && options.length < 2) {
      setError("Please add at least two options for custom selections.");
      setLoading(false);
      return;
    }

    const questionData = {
      groupId: groupId,
      category: "Daily",
      questionType: questionType,
      question: question,
      options: questionType.startsWith("custom") ? options : undefined,
      submittedBy: user.username
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
      setAlertMessage("Question created successfully!");
      setIsAlertOpen(true);
      setQuestion("");
      setOptions([""]);
      setQuestionType("");
    } catch (err:any) {
      setError(err.message);
      setAlertMessage("Failed to create question");
      setIsAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const closeAlert = () => {
    setIsAlertOpen(false);
  };

  return (
    <>
      <div className="mt-5">
      <Select value={questionType} onValueChange={setQuestionType}>
        <SelectTrigger>
          <SelectValue placeholder="Select Question Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="users-select-one">Vote One User</SelectItem>
          {/* <SelectItem value="users-select-multiple">Select Multiple Users</SelectItem> */}
          <SelectItem value="custom-select-one">Vote One Custom Option</SelectItem>
          {/* <SelectItem value="custom-select-multiple">Select Multiple Custom Options</SelectItem> */}
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
              <Button className="ml-2 w-10 p-2" variant="destructive" onClick={() => handleRemoveOption(index)}>
                  <Image src="/AppIcons/trash.svg" alt="Delete" width={20} height={20} /> 
              </Button>
            </div>
          ))}
          </div>
          <div className="flex justify-end mt-5 ">
          <Button variant="secondary" className="w-10" onClick={handleAddOption} >+</Button>
          </div>
        </>
      )}
      <div className="flex justify-center fixed bottom-20 left-0 w-full p-2 bg-background">
          <Button onClick={handleSubmit} disabled={loading || !question.trim()}>
            {loading ? "Creating..." : "Create Question"}
          </Button>
      </div>
      {isAlertOpen && (
        <AlertDialog open={isAlertOpen} >
          <AlertDialogContent className="rounded-lg w-3/4" >
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogAction onClick={closeAlert}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default CreateQuestion;
