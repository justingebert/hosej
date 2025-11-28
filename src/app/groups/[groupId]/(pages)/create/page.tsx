"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateQuestion from "@/components/features/question/createQuestion.client";
import CreateRally from "@/components/features/rally/createRally.client";
import Header from "@/components/ui/custom/Header";
import { useState } from "react";

export type createRallyData = {
    task: string;
    lengthInDays: number;
};

export type createQuestionData = {
    question: string;
    questionType: string;
    options: any[];
    mainImageFile: File | null;
    optionFiles: (File | null)[];
};

const CreatePage = () => {
    const [questionData, setQuestionData] = useState<createQuestionData>({
        question: "",
        questionType: "",
        options: [],
        mainImageFile: null,
        optionFiles: [],
    });

    const [rallyData, setRallyData] = useState<createRallyData>({task: "", lengthInDays: 0});

    return (
        <>
            <Header title="Create"/>
            {/* rightComponent={<Button variant={"outline"} size={"icon"}><Info/></Button>}/> */}
            <div className="mt-4">
                <Tabs defaultValue="create-question" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create-question">Question</TabsTrigger>
                        <TabsTrigger value="create-rally">Rally</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create-question">
                        <CreateQuestion questionData={questionData} setQuestionData={setQuestionData}/>
                    </TabsContent>
                    <TabsContent value="create-rally">
                        <CreateRally rallyData={rallyData} setRallyData={setRallyData}/>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
};

export default CreatePage;
