"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/ui/custom/Header";
import Image from "next/image";
import BackLink from "@/components/ui/custom/BackLink";
import { SkeletonList } from "@/components/ui/custom/SkeletonList";
import { useParams, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuestionResults } from "@/hooks/data/useQuestionDetails";

import type { IPairingResult, IResult, IResultUser } from "@/types/models/question";

function UserChip({ user }: { user: IResultUser }) {
    return (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-primary text-primary-foreground rounded-2xl">
            <Avatar className="h-6 w-6 shrink-0">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.username} />}
                <AvatarFallback className="text-[10px] bg-primary-foreground text-primary">
                    {user.username.slice(0, 1).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold truncate">{user.username}</span>
        </div>
    );
}

export default function ResultsDetailPage() {
    const params = useParams<{ groupId: string; questionId: string }>();
    const searchParams = useSearchParams();
    const groupId = params?.groupId ?? "";
    const questionId = params?.questionId ?? "";
    const returnTo = searchParams?.get("returnTo") ?? "";

    const { results: data, isLoading } = useQuestionResults(groupId, questionId);

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
                                                  {vc.users.map((u, uidx) => (
                                                      <UserChip key={uidx} user={u} />
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
                                  <div className="flex flex-wrap gap-2 justify-center">
                                      {result.users.map((u, idx: number) => (
                                          <UserChip key={idx} user={u} />
                                      ))}
                                  </div>
                              </CardContent>
                          </Card>
                      ))}
            </div>
        </>
    );
}
