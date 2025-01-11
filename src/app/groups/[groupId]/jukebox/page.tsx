"use client";

import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";
import { IJukebox } from "@/db/models/Jukebox";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import fetcher from "@/lib/fetcher";
import { useParams } from "next/navigation";
import useSWR from "swr";

const JukeboxPage = () => {
  const { session, user } = useAuthRedirect();
  const { groupId } = useParams<{ groupId: string }>();


  const { data, error, isLoading } = useSWR<{ jukebox: IJukebox }>(
    user ? `/api/groups/${groupId}/jukebox?isActive=true` : null,
    fetcher
  );

  return (
    <div>
      <Header
        leftComponent={<BackLink href={`/groups/${groupId}/dashboard`} />}
        title={`Jukebox DATE`}
      />
    </div>
  );
};

export default JukeboxPage;
