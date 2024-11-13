"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import SpinningLoader from "@/components/ui/custom/SpinningLoader";
import Header from "@/components/ui/custom/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Card } from "@/components/ui/card";
import BackLink from "@/components/ui/custom/BackLink";
import { RallyTabs } from "./RallyTabs";

const RallyPage = () => {
  const [loading, setLoading] = useState(true);
  const { user } = useAuthRedirect();
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
      <Header leftComponent={<BackLink href={`/groups/${groupId}/dashboard`}/>}  title="Rallies" />

      <div className="flex flex-grow justify-center items-center"> 
        <Card className="text-center p-6 bg-foreground">
          <h2 className="font-bold text-secondary">No active rallies</h2>
        </Card>
      </div>
    </div>
  )

  return (
    <div>
      <Header leftComponent={<BackLink href={`/groups/${groupId}/dashboard`}/>}  title="Rallies" />
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

export default RallyPage;
