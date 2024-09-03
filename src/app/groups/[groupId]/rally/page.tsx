"use client";

import { useEffect, useState, Suspense } from "react";
import RallyVoteCarousel from "@/components/Rally/VotingOptionsRally.client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import RallyResults from "@/components/Rally/VoteResultsRally.client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Loader from "@/components/ui/Loader";
import Header from "@/components/ui/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import SubmitRally from "@/components/Rally/submitImageRally.client";
import { Card } from "@/components/ui/card";

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
    <>
      <Card className=" bg-foreground text-center">
        <h2 className="font-bold p-6 text-secondary">{rally.task}</h2>
      </Card>
      {!rally.votingOpen && (
        <SubmitRally
          rally={rally}
          groupId={groupId}
          user={user}
          userHasUploaded={userHasUploaded}
          setUserHasUploaded={setUserHasUploaded}
          setUserHasVoted={setUserHasVoted}
        />
      )}
      {rally.votingOpen &&
        (userHasVoted[rally._id] ? (
          <div className="mt-5">
            <RallyResults user={user} rally={rally} />
          </div>
        ) : (
          <div className="mt-10">
            <RallyVoteCarousel user={user} rally={rally} onVote={handleVote} />
          </div>
        ))}
    </>
  );
}

const RallyPage = () => {
  const [loading, setLoading] = useState(true);
  const { session, status, user } = useAuthRedirect();
  const [rallies, setRallies] = useState<any[]>([]);
  const [userHasVoted, setUserHasVoted] = useState<any>({});
  const [userUploaded, setUserUploaded] = useState<any>({});
  const router = useRouter();
  const { groupId } = useParams<{ groupId: string }>();

  useEffect(() => {
    const fetchRallies = async () => {
      setLoading(true);
      router.refresh();
      const res = await fetch(`/api/${groupId}/rally`);
      const data = await res.json();

      if (data.rallies) {
        setRallies(data.rallies);
        const votes = data.rallies.reduce((acc: any, rally: any) => {
          acc[rally._id] = rally.submissions.some((submission: any) =>
            submission.votes.some((vote: any) => vote.username === user.username)
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
      if (data.message) {
        alert(data.message); //TODO improve
      }
      setLoading(false);
    };

    if (user) {
      fetchRallies();
    }
  }, [user, router, groupId]);

  if (loading) return <Loader loading={true} />
  if (!rallies) return <p>No Rally avaiable</p>

  return (
    <>
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
    </>
  );
};

export default RallyPage;
