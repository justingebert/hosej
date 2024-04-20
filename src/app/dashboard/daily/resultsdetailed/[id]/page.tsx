import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";
import Question from "@/db/models/Question";
import user from "@/db/models/user";
import Link from "next/link";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"


export default async function ResultsDetailPage({ params }: { params: { id: string } }) {
  await dbConnect();  
  const questionId = params.id;
    
  console.log(questionId);

    await user.find({}); //TODO find better solution to avoid missing sschema error
    const question = await Question.findById(questionId).populate("answers.username");

    const groupedResponses:any = {};
    question.answers.forEach((answer:any) => {
        const response = answer.response;
        if (!groupedResponses[response]) {
            groupedResponses[response] = [];
        }
        groupedResponses[response].push(answer.username.username);
    });

  return (
    <div className="m-6">
      <div className="flex items-center">
        <Link className="text-lg leading-none mr-auto cursor-pointer" href={`/dashboard/daily?returnTo=${params.id}`}>
          ← 
        </Link>
      </div>
      <div className="grid grid-cols-1 mt-5">
      {Object.entries(groupedResponses).map(([response, usernames]:any, index) => (
        <Card className="w-[350px] text-center red mt-5" key={index}>
        <CardHeader>
          <CardTitle>{response}</CardTitle>
        </CardHeader>
        <CardContent>
                <div className="grid grid-cols-2">
                    {usernames.map((username:any, idx:number) => (
                        <div key={idx} className="m-2 p-2 bg-black rounded-lg text-center text-white font-bold">{username}</div>
                    ))}
                </div>
        </CardContent>
        </Card>
            ))}
            </div>
    </div>
  );
};
