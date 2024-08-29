import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/ui/Header";


export default async function ResultsDetailPage({params }: {params: { groupId: string, questionId:string };}) {
  const { questionId, groupId } = params;
  await dbConnect();

  const question = await Question.findById(questionId).populate(
    "answers.username"
  );

  const groupedResponses: any = {};
  question.answers.forEach((answer: any) => {
    const response = answer.response;
    if (!groupedResponses[response]) {
      groupedResponses[response] = [];
    }
    groupedResponses[response].push(answer.username.username);
  });
  // Convert the object to an array of entries
  const entries = Object.entries(groupedResponses);
  // Sort the array based on the length of the arrays of usernames
  entries.sort((a:any, b:any) => b[1].length - a[1].length);
  // Convert the sorted array back to an object
  const sortedGroupedResponses = Object.fromEntries(entries);



  return (
    <>
      <Header href={`/groups/${groupId}/daily`}/>
      <div className="grid grid-cols-1 gap-5 mb-7">
        {Object.entries(sortedGroupedResponses).map(
          ([response, usernames]: any, index) => (
            <Card className="w-full max-w-md mx-auto text-center" key={index}>
              <CardHeader>
                <CardTitle>{response}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2">
                  {usernames.map((username: any, idx: number) => (
                    <div
                      key={idx}
                      className="m-2 p-2 bg-primary rounded-lg text-center text-primary-foreground font-bold"
                    >
                      {username}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </>
  );
}
