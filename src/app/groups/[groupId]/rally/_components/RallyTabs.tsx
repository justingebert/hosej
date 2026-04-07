"use client";

import RallyResults from "@/app/groups/[groupId]/rally/_components/VoteResultsRally.client";
import RallyVoteCarousel from "@/app/groups/[groupId]/rally/_components/VotingOptionsRally.client";
import SubmitRally from "@/app/groups/[groupId]/rally/_components/submitImageRally.client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import type { RallyDTO } from "@/types/models/rally";
import { RallyStatus } from "@/types/models/rally";

interface RallyTabsProps {
    groupId: string;
    user: Session["user"] | undefined;
    rallies: RallyDTO[];
    userHasVoted: Record<string, boolean>;
    userHasUploaded: Record<string, boolean>;
    onMutate: () => void;
}

export function RallyTabs({
    groupId,
    user,
    rallies,
    userHasVoted,
    userHasUploaded,
    onMutate,
}: RallyTabsProps) {
    const searchParams = useSearchParams();
    const defaultTab =
        searchParams?.get("returnTo") || (rallies.length > 0 ? rallies[0]._id : undefined);

    // Single rally — no tabs needed
    if (rallies.length === 1) {
        return (
            <RallyTabContent
                groupId={groupId}
                user={user}
                rally={rallies[0]}
                hasVoted={userHasVoted[rallies[0]._id] ?? false}
                hasUploaded={userHasUploaded[rallies[0]._id] ?? false}
                onMutate={onMutate}
            />
        );
    }

    return (
        <Tabs defaultValue={defaultTab}>
            <TabsList
                className="grid w-full mb-4"
                style={{ gridTemplateColumns: `repeat(${rallies.length}, minmax(0, 1fr))` }}
            >
                {rallies.map((rally, index) => (
                    <TabsTrigger key={rally._id} value={rally._id}>
                        {"Rally " + (index + 1)}
                    </TabsTrigger>
                ))}
            </TabsList>
            {rallies.map((rally) => (
                <TabsContent key={rally._id} value={rally._id}>
                    <RallyTabContent
                        groupId={groupId}
                        user={user}
                        rally={rally}
                        hasVoted={userHasVoted[rally._id] ?? false}
                        hasUploaded={userHasUploaded[rally._id] ?? false}
                        onMutate={onMutate}
                    />
                </TabsContent>
            ))}
        </Tabs>
    );
}

function RallyTabContent({
    groupId,
    user,
    rally,
    hasVoted,
    hasUploaded,
    onMutate,
}: {
    groupId: string;
    user: Session["user"] | undefined;
    rally: RallyDTO;
    hasVoted: boolean;
    hasUploaded: boolean;
    onMutate: () => void;
}) {
    return (
        <div className="flex flex-col grow min-h-[75dvh]">
            <Card className="text-center flex-none mb-4">
                <h2 className="font-bold p-5 text-lg">{rally.task}</h2>
            </Card>

            {rally.status === RallyStatus.Submission && (
                <SubmitRally
                    rally={rally}
                    groupId={groupId}
                    user={user}
                    hasUploaded={hasUploaded}
                    onMutate={onMutate}
                />
            )}

            {rally.status === RallyStatus.Voting &&
                (hasVoted ? (
                    <RallyResults user={user} rally={rally} />
                ) : (
                    <RallyVoteCarousel user={user} rally={rally} onVote={onMutate} />
                ))}

            {rally.status === RallyStatus.Results && <RallyResults user={user} rally={rally} />}
        </div>
    );
}
