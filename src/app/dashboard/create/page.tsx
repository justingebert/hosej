"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

const CreateQuestionPage = () => {
  const [question, setQuestion] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [options, setOptions] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<String>("");

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
      category: "Daily",
      questionType: questionType,
      question: question,
      options: questionType.startsWith("custom") ? options : undefined,
    };

    try {
      const response = await fetch("/api/question/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) throw new Error("Failed to create question");
      alert("Question created successfully!");
      setQuestion("");
      setOptions([""]);
      setQuestionType("");
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-6">
      <div className="flex items-center">
        <Link className="text-lg leading-none mr-auto cursor-pointer" href="/">
          ← Back
        </Link>
      </div>
      <h1 className="text-center m-5">Create Question</h1>
      <p className="text-center mt-20">
        Frage muss mit einem Namen von uns beantwortbar sein! (Wer trollt der fliegt!)
      </p>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="mt-5">
      <Select value={questionType} onValueChange={setQuestionType}>
        <SelectTrigger className="w-[340px]">
          <SelectValue placeholder="Select Question Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="users-select-one">Select One User</SelectItem>
          {/* <SelectItem value="users-select-multiple">Select Multiple Users</SelectItem> */}
          <SelectItem value="custom-select-one">Select One Custom Option</SelectItem>
          {/* <SelectItem value="custom-select-multiple">Select Multiple Custom Options</SelectItem> */}
          {/* <SelectItem value="text">Text</SelectItem> */}
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
            <div key={index} className="mt-2 flex">
              <Input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => handleOptionChange(e.target.value, index)}
              />
              <Button className=" ml-2" variant="destructive" onClick={() => handleRemoveOption(index)}>
                <Image src="/trash.svg" alt="Delete" style={{ height: '20px' }} />
              </Button>
            </div>
          ))}
          </div>
          <Button onClick={handleAddOption} className="mt-5">Add Option</Button>
        </>
      )}
      <div className="flex justify-center mt-20">
        <Button onClick={handleSubmit} disabled={loading || !question.trim()}>
          {loading ? "Creating..." : "Create Question"}
        </Button>
      </div>
    </div>
  );
};

export default CreateQuestionPage;
