"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/context/UserContext";

const CreateRallyPage = () => {
  const {username} = useUser()
  const [task, setTask] = useState("");
  const [lengthInDays, setLengthInDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<String>("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const rallyData = {
      task: task,
      lengthInDays: Number(lengthInDays),
      submittedBy: username 
    };

    try {
      const response = await fetch("/api/rally", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rallyData),
      });

      if (!response.ok) throw new Error("Failed to create rally");
      setAlertMessage("Rally created successfully!");
      setIsAlertOpen(true);
      setTask("");
      setLengthInDays("");
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeAlert = () => {
    setIsAlertOpen(false);
  };

  return (
    <div>
      <h1 className="text-center m-5">Create Rally</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="mt-5">
        <Input
          type="text"
          placeholder="Enter task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          required
        />
      </div>
      <div className="mt-5">
        <Input
          type="number"
          placeholder="Enter length in days"
          value={lengthInDays}
          onChange={(e) => setLengthInDays(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-center mt-20">
        <Button onClick={handleSubmit} disabled={loading || !task.trim() || !lengthInDays}>
          {loading ? "Creating..." : "Create Rally"}
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
    </div>
  );
};

export default CreateRallyPage;
