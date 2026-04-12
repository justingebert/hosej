"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/ui/custom/Header";
import { useState } from "react";
import type { createQuestionData, createRallyData } from "@/types/create";

const CreateQuestion = dynamic(
    () => import("@/app/groups/[groupId]/(pages)/create/_components/createQuestion.client")
);
const CreateRally = dynamic(
    () => import("@/app/groups/[groupId]/(pages)/create/_components/createRally.client")
);

export default function CreatePage() {
    const [questionData, setQuestionData] = useState<createQuestionData>({
        question: "",
        questionType: "",
        multiSelect: false,
        options: [],
        mainImageFile: null,
        optionFiles: [],
    });

    const [rallyData, setRallyData] = useState<createRallyData>({ task: "", lengthInDays: 0 });

    return (
        <>
            <Header title="Create" />
            {/* rightComponent={<Button variant={"outline"} size={"icon"}><Info/></Button>}/> */}
            <div className="mt-4">
                <Tabs defaultValue="create-question" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create-question">Question</TabsTrigger>
                        <TabsTrigger value="create-rally">Rally</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create-question">
                        <CreateQuestion
                            questionData={questionData}
                            setQuestionData={setQuestionData}
                        />
                    </TabsContent>
                    <TabsContent value="create-rally">
                        <CreateRally rallyData={rallyData} setRallyData={setRallyData} />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
