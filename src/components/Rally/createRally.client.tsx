"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { IUser } from "@/db/models/user";
import { useToast } from "@/hooks/use-toast"; 

const CreateRally = () => {
  const { session, status } = useAuthRedirect();
  const user = session!.user as IUser;
  const [task, setTask] = useState("");
  const [lengthInDays, setLengthInDays] = useState("");
  const [loading, setLoading] = useState(false);
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast(); // Initialize the toast

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const rallyData = {
      groupId: groupId,
      task: task,
      lengthInDays: Number(lengthInDays),
      submittedBy: user.username,
    };

    try {
      const response = await fetch(`/api/${groupId}/rally`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rallyData),
      });

      if (!response.ok) throw new Error("Failed to create rally");
      
      toast({title: "Rally created successfully!",});

      setTask("");
      setLengthInDays("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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
          pattern="\d*"
          placeholder="Enter length in days"
          value={lengthInDays}
          onChange={(e) => setLengthInDays(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-center fixed bottom-20 left-0 w-full p-2 bg-background">
        <Button onClick={handleSubmit} disabled={loading || !task.trim() || !lengthInDays}>
          {loading ? "Creating..." : "Create Rally"}
        </Button>
      </div>
    </div>
  );
};

export default CreateRally;
