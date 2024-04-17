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

const CreateQuestionPage = () => {
  const [question, setQuestion] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [options, setOptions] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleOptionChange = (value, index) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
    } catch (err) {
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
      <Select value={questionType} onValueChange={setQuestionType}>
        <SelectTrigger className="w-[340px]">
          <SelectValue placeholder="Select Question Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="users-select-one">Select One User</SelectItem>
          <SelectItem value="users-select-multiple">Select Multiple Users</SelectItem>
          <SelectItem value="custom-select-one">Select One Custom Option</SelectItem>
          <SelectItem value="custom-select-multiple">Select Multiple Custom Options</SelectItem>
          <SelectItem value="text">Text</SelectItem>
          <SelectItem value="rating">Rating (1-10)</SelectItem>
        </SelectContent>
      </Select>
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
          {options.map((option, index) => (
            <div key={index} className="mt-2">
              <Input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => handleOptionChange(e.target.value, index)}
              />
            </div>
          ))}
          <Button onClick={handleAddOption}>Add Option</Button>
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
