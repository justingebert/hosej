"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/ui/custom/Header";
import Image from "next/image";
import BackLink from "@/components/ui/custom/BackLink";
import fetcher from "@/lib/fetcher";
import { SkeletonList } from "@/components/ui/custom/SkeletonList";
import { useParams, useSearchParams } from "next/navigation";

import type { IPairingResult, IResult, QuestionResultsDTO } from "@/types/models/question";

export default function ResultsDetailPage() {
    const params = useParams<{ groupId: string; questionId: string }>();
    const searchParams = useSearchParams();
    const groupId = params?.groupId ?? "";
    const questionId = params?.questionId ?? "";
    const returnTo = searchParams?.get("returnTo") ?? "";

    const { data, isLoading } = useSWR<QuestionResultsDTO>(
        `/api/groups/${groupId}/question/${questionId}/results`,
        fetcher
    );

    if (isLoading)
        return (
            <>
                <Header
                    leftComponent={<BackLink href={`/groups/${groupId}/${returnTo}`} />}
                    title={" "}
                />
                <SkeletonList count={10} className="h-36 mb-6" />
            </>
        );

    //TODO this should never happen -> should redirect back
    if (!data) {
        return null;
    }

    const { results, pairingResults, questionType } = data;
    const isPairing = questionType === "pairing";
    const isImage = questionType === "image";

    return (
        <>
            <Header
                leftComponent={<BackLink href={`/groups/${groupId}/${returnTo}`} />}
                title={" "}
            />
            <div className="grid grid-cols-1 gap-5 pb-20">
                {isPairing && pairingResults
                    ? pairingResults.map((pr: IPairingResult, index: number) => (
                          <Card className="w-full max-w-md mx-auto" key={index}>
                              <CardHeader>
                                  <CardTitle className="text-center">{pr.key}</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                  {pr.valueCounts.map((vc, idx) => (
                                      <div key={idx} className="bg-secondary rounded-lg p-3">
                                          <div className="flex justify-between items-center">
                                              <span className="font-medium">{vc.value}</span>
                                              <span className="text-sm text-muted-foreground">
                                                  {vc.count} ({vc.percentage}%)
                                              </span>
                                          </div>
                                          {vc.users.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-2">
                                                  {vc.users.map((username, uidx) => (
                                                      <span
                                                          key={uidx}
                                                          className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full"
                                                      >
                                                          {username}
                                                      </span>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </CardContent>
                          </Card>
                      ))
                    : results.map((result: IResult, index: number) => (
                          <Card className="w-full max-w-md mx-auto text-center" key={index}>
                              <CardHeader>
                                  <CardTitle>
                                      {isImage ? (
                                          <Image
                                              src={result.option}
                                              alt={`Response ${index + 1}`}
                                              width={350}
                                              height={150}
                                              className="object-cover rounded-lg mx-auto"
                                              priority={index === 0}
                                          />
                                      ) : (
                                          result.option
                                      )}
                                  </CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <div className="grid grid-cols-2">
                                      {result.users.map((username: string, idx: number) => (
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
                      ))}
            </div>
        </>
    );
}
