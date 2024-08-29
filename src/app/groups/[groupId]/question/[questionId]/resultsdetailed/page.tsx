import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/ui/Header";

export default async function ResultsDetailPage({ params }: { params: { groupId: string, questionId: string }; }) {
  const { questionId, groupId } = params;

  console.log("Connecting to the database...");
  await dbConnect();
  console.log("Database connected.");

  console.log(`Fetching question with ID: ${questionId}`);
  const question = await Question.findById(questionId).populate("answers.username");

  if (!question) {
    console.error(`Question with ID: ${questionId} not found.`);
    return <p>Question not found</p>; // Return early if the question is not found
  }

  console.log("Processing answers...");
  const groupedResponses: any = {};
  question.answers.forEach((answer: any) => {
    const response = answer.response;
    if (!groupedResponses[response]) {
      groupedResponses[response] = [];
    }
    groupedResponses[response].push(answer.username.username);
  });

  console.log("Sorting responses...");
  const entries = Object.entries(groupedResponses);
  entries.sort((a: any, b: any) => b[1].length - a[1].length);
  const sortedGroupedResponses = Object.fromEntries(entries);

  console.log("Rendering page with sorted responses...");
  return (
    <>
      <Header href={`/groups/${groupId}/daily`} />
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
