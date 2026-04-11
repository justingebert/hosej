"use client";

import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useGroupRallies } from "@/hooks/data/useGroupRallies";
import type { createRallyData } from "@/types/create";

interface CreateRallyProps {
    rallyData: createRallyData;
    setRallyData: React.Dispatch<React.SetStateAction<createRallyData>>;
}

const CreateRally = ({ rallyData, setRallyData }: CreateRallyProps) => {
    const [loading, setLoading] = useState(false);
    const params = useParams<{ groupId: string }>();
    const groupId = params?.groupId;
    const { toast } = useToast();
    const { createRally } = useGroupRallies(groupId);

    const lengthInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createRally({
                task: rallyData.task,
                lengthInDays: rallyData.lengthInDays,
            });
            toast({ title: "Rally created successfully!" });
            setRallyData({ task: "", lengthInDays: 0 });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create rally!";
            toast({ title: "Error", description: message, variant: "destructive" });
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
                    value={rallyData.task}
                    onChange={(e) => setRallyData((prev) => ({ ...prev, task: e.target.value }))}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && lengthInputRef.current) {
                            e.preventDefault();
                            lengthInputRef.current.focus();
                        }
                    }}
                    required
                />
            </div>
            <div className="mt-5">
                <Input
                    ref={lengthInputRef}
                    min={1}
                    max={30}
                    type="number"
                    placeholder="Enter time for task in days"
                    value={rallyData.lengthInDays || ""}
                    onChange={(e) => {
                        const value = e.target.valueAsNumber;
                        setRallyData((prev) => ({
                            ...prev,
                            lengthInDays: isNaN(value) ? 0 : value,
                        }));
                    }}
                    required
                />
            </div>
            <div className="flex justify-center fixed bottom-6 left-0 w-full p-6 bg-background mb-16">
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !rallyData.task.trim() || rallyData.lengthInDays <= 0}
                    className="w-full h-12"
                >
                    {loading ? "Creating..." : "Create Rally"}
                </Button>
            </div>
        </div>
    );
};

export default CreateRally;
