"use client";

import { useEffect, useState, Suspense } from "react";
import RallyVoteCarousel from "@/components/Rally/VotingOptionsRally.client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import RallyResults from "@/components/Rally/VoteResultsRally.client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpinningLoader from "@/components/ui/custom/SpinningLoader";
import Header from "@/components/ui/custom/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import SubmitRally from "@/components/Rally/submitImageRally.client";
import { Card } from "@/components/ui/card";

const RallyPage = () => {
  const [loading, setLoading] = useState(true);
  const { session, status, user } = useAuthRedirect();
  const [rallies, setRallies] = useState<any[]>([]);
  const [rallyInactive, setRallyInactive] = useState<any>(false);
  const [userHasVoted, setUserHasVoted] = useState<any>({});
  const [userUploaded, setUserUploaded] = useState<any>({});
  const router = useRouter();
  const { groupId } = useParams<{ groupId: string }>();

  useEffect(() => {
    const fetchRallies = async () => {
      setLoading(true);
      router.refresh();
      const res = await fetch(`/api/groups/${groupId}/rally`);
      const data = await res.json();

      if (data.rallies) {
        if (data.rallies.length === 0) {
          setRallyInactive(true);
        }
        setRallies(data.rallies);
        const votes = data.rallies.reduce((acc: any, rally: any) => {
          acc[rally._id] = rally.submissions.some((submission: any) =>
            submission.votes.some((vote: any) => vote.user === user._id)
          );
          return acc;
        }, {});
        setUserHasVoted(votes);
        const userHasUploaded = data.rallies.reduce((acc: any, rally: any) => {
          acc[rally._id] = rally.submissions.some((submission: any) =>
            submission.username === user.username
          );
          return acc;
        }, {});
        setUserUploaded(userHasUploaded);
      }
      if (data.message === "No active rallies") {
        setRallyInactive(true);
      }
      setLoading(false);
    };

    if (user) {
      fetchRallies();
    }
  }, [user, router, groupId]);

  if (loading) return <SpinningLoader loading={true} />
  if (rallyInactive) return (
<div className="flex flex-col h-[100dvh]"> 
  <Header href={`/groups/${groupId}/dashboard`} title="Rallies" />

  <div className="flex flex-grow justify-center items-center"> 
    <Card className="text-center p-6 bg-foreground">
      <h2 className="font-bold text-secondary">No active rallies</h2>
    </Card>
  </div>
</div>

  )

  return (
    <div>
      <Header href={`/groups/${groupId}/dashboard`} title="Rallies" />
      <RallyTabs
            groupId={groupId}
            user={user}
            rallies={rallies}
            userHasVoted={userHasVoted}
            userHasUploaded={userUploaded}
            setUserHasVoted={setUserHasVoted}
            setUserHasUploaded={setUserUploaded}
          />
    </div>
  );
};

function RallyTabs({ groupId, user, rallies, userHasVoted, userHasUploaded, setUserHasVoted, setUserHasUploaded }: any) {
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
          <RallyTabContent groupId={groupId} user={user} rally={rally} userHasVoted={userHasVoted} userHasUploaded={userHasUploaded} setUserHasVoted={setUserHasVoted}  setUserHasUploaded={setUserHasUploaded} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function RallyTabContent({ groupId, user, rally, userHasVoted, userHasUploaded,setUserHasVoted, setUserHasUploaded }: any) {
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
      setUserHasVoted={setUserHasVoted}
    />
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

export default RallyPage;
