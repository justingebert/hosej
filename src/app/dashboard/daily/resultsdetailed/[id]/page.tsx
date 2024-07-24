import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import user from "@/db/models/user";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import BackLink from "@/components/BackLink";

export default async function ResultsDetailPage({params }: {params: { id: string };}) {
  await dbConnect();
  const questionId = params.id;

  console.log(questionId);

  await user.find({}); //TODO find better solution to avoid missing schema error
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
      <BackLink href={`/dashboard/daily?returnTo=${params.id}`} />
      <div className="grid grid-cols-1 gap-5">
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
