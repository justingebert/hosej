import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft } from 'lucide-react';
import CreateQuestionPage from "@/components/Question/createQuestion.client";
import CreateRallyPage from "@/components/Rally/createRally.client";

const CreatePage = () => {
  return (
    <div className="m-6">
      <div className="flex items-center">
        <Link className="text-lg leading-none mr-auto cursor-pointer" href="/">
          <ArrowLeft />
        </Link>
      </div>
      <div className="mt-7">
      <Tabs defaultValue="create-question" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create-question">Create Question</TabsTrigger>
          <TabsTrigger value="create-rally">Create Rally</TabsTrigger>
        </TabsList>
        <TabsContent value="create-question">
          <CreateQuestionPage />
        </TabsContent>
        <TabsContent value="create-rally">
          <CreateRallyPage />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default CreatePage;