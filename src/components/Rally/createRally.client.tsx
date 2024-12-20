"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useToast } from "@/hooks/use-toast"; 

const CreateRally = () => {
  const [task, setTask] = useState("");
  const [lengthInDays, setLengthInDays] = useState("");
  const [loading, setLoading] = useState(false);
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const rallyData = {
      task: task,
      lengthInDays: Number(lengthInDays),
    };

    try {
      const response = await fetch(`/api/groups/${groupId}/rally`, {
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
      <div className="flex justify-center fixed bottom-6 left-0 w-full p-6 bg-background">
        <Button onClick={handleSubmit} disabled={loading || !task.trim() || !lengthInDays} className="w-full h-12">
          {loading ? "Creating..." : "Create Rally"}
        </Button>
      </div>
    </div>
  );
};

export default CreateRally;
