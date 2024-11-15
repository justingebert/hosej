import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/ui/custom/Header";
import User from "@/db/models/user";
import Image from "next/image";
import { generateSignedUrl } from "@/lib/question/questionOptions";
import BackLink from "@/components/ui/custom/BackLink";

export default async function ResultsDetailPage({ params, searchParams }: { params: { groupId: string, questionId: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
  const { questionId, groupId } = params;
  const { returnTo } = searchParams || {};

  await dbConnect();

  const question = await Question.findById(questionId).populate({
    path: 'answers.user',
    model: User,
  });

  //TODO THIS NEEDS TO BE CHANGED TO GROUP NAME
  const groupedResponses: any = {};
  question.answers.forEach((answer: any) => {
    const response = answer.response;
    if (!groupedResponses[response]) {
      groupedResponses[response] = [];
    }
    groupedResponses[response].push(answer.user.username);
  });

  const entries = await Promise.all(Object.entries(groupedResponses).map(async ([response, usernames]: any) => {
    if (question.questionType.startsWith("image")) {
      try {
        const { url } = await generateSignedUrl(response, 60);
        return [url, usernames];
      } catch (s3Error: any) {
          console.error(`Failed to generate pre-signed URL for ${response}`, s3Error);
          throw new Error(`Failed to generate pre-signed URL: ${s3Error.message}`);
      }
    } else {
      return [response, usernames];
    }
  }));

  const sortedGroupedResponses = Object.fromEntries(entries);

  return (
    <>
      <Header leftComponent={<BackLink href={`/groups/${groupId}/${returnTo}`} />} title={" "}/>
      <div className="grid grid-cols-1 gap-5 mb-7">
        {Object.entries(sortedGroupedResponses).map(
          ([response, usernames]: any, index) => (
            <Card className="w-full max-w-md mx-auto text-center" key={index}>
              <CardHeader>
                <CardTitle>
                  {question.questionType.startsWith("image") ? (
                    <Image
                      src={response}
                      alt={`Response ${index + 1}`}
                      width={350}
                      height={150}
                      className="object-cover rounded-lg mx-auto"
                      priority={index === 0}
                    />
                  ) : (
                    response
                  )}
                </CardTitle>
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
