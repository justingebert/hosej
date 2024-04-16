"use client";
import React, { useState } from "react";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import Link from 'next/link'

//TODO improve error handeling
const CreateQuestionPage = () => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    setLoading(true);
    setError(null);

    const questionData = {
      category: "Daily",
      questionType: "users-select-one",
      question: question,
      //options: "",
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
          ←
        </Link>
      </div>
      <h1 className="text-center flex-1">Create Question</h1>
      <div className="text-center m-5">
        <h1>Create Question</h1>
      </div>
      <div className="text-center mt-20">
        <p>
          Frage muss mit einem Namen von uns beantwortbar sein! (Wer trollt der
          fliegt!)
        </p>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="mt-5">
        <div>
        <Input
          type="text"
          placeholder="Frage eingeben"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
        </div>
        <div className="flex justify-center mt-20">
            <Button onClick={handleSubmit} disabled={loading || !question.trim()}>
            {loading ? "Creating..." : "Create Question"}
            </Button>
        </div>

      </div>
    </div>
  );
};

export default CreateQuestionPage;
