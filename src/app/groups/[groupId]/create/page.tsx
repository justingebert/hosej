import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import CreateQuestion from "@/components/Question/createQuestion.client";
import CreateRally from "@/components/Rally/createRally.client";
import BackLink from "@/components/ui/BackLink";


const CreatePage = ({ params }: { params: { groupId: string } }) => {
  const { groupId } = params;
  
  return (
    <>
      <BackLink href={`/groups/${groupId}/dashboard`} />
      <div className="mt-7">
      <Tabs defaultValue="create-question" className="w-full">

        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create-question">Create Question</TabsTrigger>
          <TabsTrigger value="create-rally">Create Rally</TabsTrigger>
        </TabsList>

        <TabsContent value="create-question">
          <CreateQuestion />
        </TabsContent>
        <TabsContent value="create-rally">
          <CreateRally />
        </TabsContent>

      </Tabs>
      </div>
    </>
  );
};

export default CreatePage;