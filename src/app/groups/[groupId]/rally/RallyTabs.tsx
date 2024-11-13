import RallyResults from "@/components/Rally/VoteResultsRally.client";
import RallyVoteCarousel from "@/components/Rally/VotingOptionsRally.client";
import SubmitRally from "@/components/Rally/submitImageRally.client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";

export function RallyTabs({ groupId, user, rallies, userHasVoted, userHasUploaded, setUserHasVoted, setUserHasUploaded }: any) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('returnTo') || (rallies.length > 0 ? rallies[0]._id : undefined);

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
          <RallyTabContent groupId={groupId} user={user} rally={rally} userHasVoted={userHasVoted} userHasUploaded={userHasUploaded} setUserHasVoted={setUserHasVoted} setUserHasUploaded={setUserHasUploaded} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
function RallyTabContent({ groupId, user, rally, userHasVoted, userHasUploaded, setUserHasVoted, setUserHasUploaded }: any) {
  const router = useRouter();

  const handleVote = async () => {
    setUserHasVoted((prev: any) => ({ ...prev, [rally._id]: true }));
    router.refresh();
  };

  return (
    <div className="flex flex-col grow h-[80dvh]">
      <Card className=" bg-foreground text-center flex-none">
        <h2 className="font-bold p-6 text-secondary">{rally.task}</h2>
      </Card>
      {!rally.votingOpen && !rally.resultsShowing && (
        <SubmitRally
          rally={rally}
          groupId={groupId}
          user={user}
          userHasUploaded={userHasUploaded}
          setUserHasUploaded={setUserHasUploaded}
          setUserHasVoted={setUserHasVoted} />
      )}

      {rally.votingOpen && !rally.resultsShowing && (
        userHasVoted[rally._id] ? (
          <div className="mt-5">
            <RallyResults user={user} rally={rally} />
          </div>
        ) : (
          <RallyVoteCarousel user={user} rally={rally} onVote={handleVote} />
        )
      )}

      {rally.resultsShowing && (
        <div className="mt-5">
          <RallyResults user={user} rally={rally} />
        </div>
      )}
    </div>
  );
}
