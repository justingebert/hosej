"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import SpinningLoader from "@/components/ui/custom/SpinningLoader";
import Header from "@/components/ui/custom/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Card } from "@/components/ui/card";
import BackLink from "@/components/ui/custom/BackLink";
import { RallyTabs } from "./RallyTabs";
import fetcher from "@/lib/fetcher";
import { IRally } from "@/db/models/rally";

const RallyPage = () => {
  const { user } = useAuthRedirect();
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();

  const { data, error, isLoading } = useSWR<{rallies: IRally[]}>(user ? `/api/groups/${groupId}/rally` : null, fetcher);

  if (isLoading) return <SpinningLoader loading={true} />;
  if (error) return <div className="text-red-500">Failed to load rallies data.</div>;

  const rallies = data?.rallies || [];
  const rallyInactive = !rallies.length

  // Calculate user vote and upload status based on the fetched data
  const userHasVoted = rallies.reduce((acc: Record<string, boolean>, rally) => {
    const rallyId = rally._id.toString(); // Ensure _id is a string
    acc[rallyId] = rally.submissions.some((submission) =>
      submission.votes.some((vote:any) => vote.user === user._id)
    );
    return acc;
  }, {});

  const userHasUploaded = rallies.reduce((acc: Record<string, boolean>, rally) => {
    const rallyId = rally._id.toString(); // Ensure _id is a string
    acc[rallyId] = rally.submissions.some((submission) =>
      submission.username === user.username
    );
    return acc;
  }, {});

  if (rallyInactive) {
    return (
      <div className="flex flex-col h-[100dvh]"> 
        <Header leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />} title="Rallies" />
        <div className="flex flex-grow justify-center items-center"> 
          <Card className="text-center p-6 bg-foreground">
            <h2 className="font-bold text-secondary">No active rallies</h2>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />} title="Rallies" />
      <RallyTabs
        groupId={groupId}
        user={user}
        rallies={rallies}
        userHasVoted={userHasVoted}
        userHasUploaded={userHasUploaded}
        setUserHasVoted={(newStatus: boolean) => {
          if (rallies.length > 0) {
            const rallyId = rallies[0]._id.toString(); // Convert to string before using as an index
            userHasVoted[rallyId] = newStatus;
            router.refresh();
          }
        }}
        setUserHasUploaded={(newStatus: boolean) => {
          if (rallies.length > 0) {
            const rallyId = rallies[0]._id.toString(); // Convert to string before using as an index
            userHasUploaded[rallyId] = newStatus;
            router.refresh();
          }
        }}
      />
    </div>
  );
};

export default RallyPage;
