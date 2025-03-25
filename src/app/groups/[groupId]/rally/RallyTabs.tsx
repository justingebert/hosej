import RallyResults from "@/components/Rally/VoteResultsRally.client";
import RallyVoteCarousel from "@/components/Rally/VotingOptionsRally.client";
import SubmitRally from "@/components/Rally/submitImageRally.client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";

export function RallyTabs({ groupId, user, rallies }: any) {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get("returnTo") || (rallies.length > 0 ? rallies[0]._id : undefined);

    return (
        <Tabs defaultValue={defaultTab}>
            <TabsList
                className="grid w-full"
                style={{ gridTemplateColumns: `repeat(${rallies.length}, minmax(0, 1fr))` }}
            >
                {rallies.map((rally: any, index: number) => (
                    <TabsTrigger key={rally._id} value={rally._id}>
                        {"Rally " + (index + 1)}
                    </TabsTrigger>
                ))}
            </TabsList>
            {rallies.map((rally: any) => (
                <TabsContent key={rally._id} value={rally._id}>
                    <RallyTabContent groupId={groupId} user={user} rally={rally} />
                </TabsContent>
            ))}
        </Tabs>
    );
}

function RallyTabContent({ groupId, user, rally }: any) {
    return (
        <div className="flex flex-col grow h-[80dvh]">
            <Card className=" bg-foreground text-center flex-none">
                <h2 className="font-bold p-6 text-secondary">{rally.task}</h2>
            </Card>
            {!rally.votingOpen && !rally.resultsShowing && <SubmitRally rally={rally} groupId={groupId} user={user} />}

            {rally.votingOpen &&
                (rally.userHasVoted ? (
                    <div className="mt-5">
                        <RallyResults user={user} rally={rally} />
                    </div>
                ) : (
                    <RallyVoteCarousel rally={rally} />
                ))}

            {rally.resultsShowing && (
                <div className="mt-5">
                    <RallyResults user={user} rally={rally} />
                </div>
            )}
        </div>
    );
}
