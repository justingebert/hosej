"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SpinningLoader from '@/components/ui/custom/SpinningLoader';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function JoinGroup({ params }: { params: { id: string }; }) {
  const { session, status } = useAuthRedirect();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const { toast } = useToast();

  const joinRequestInProgress = useRef(false); // Ref to track if join request is already in progress

  useEffect(() => {
    if (status === "loading" || loading || joined || joinRequestInProgress.current) return;

    const groupId = params.id;
    if (!groupId) {
      setError('Missing group ID');
      return;
    }

    const joinGroup = async () => {
      joinRequestInProgress.current = true; // Mark request as in progress
      setLoading(true);
      try {
        const res = await fetch('/api/groups/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId,
            userId: (session?.user as any)._id,
          }),
        });

        const responseData = await res.json();
        console.log(responseData);

        if (res.ok) {
          setJoined(true);
          toast({
            title: "Success",
            description: "Successfully joined the group",
            variant: "default",
          });
          router.push(`/groups/`);
        } else if (responseData.message === "User is already a member of this group") {
          setJoined(true); // Mark as joined to prevent re-running
          toast({
            title: "Error",
            description: "You are already a member of this group",
            variant: "destructive",
          });
          router.push(`/groups/`);
        } else {
          toast({
            title: "Error",
            description: "Something went wrong",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        setError("Failed to join group: " + error.message);
      } finally {
        setLoading(false);
        joinRequestInProgress.current = false; // Reset the request tracker
      }
    };

    if (session?.user && groupId && !loading && !joined) {
      joinGroup();
    }
  }, [session?.user, status, params.id, joined]); // Simplified dependencies

  if (status === 'loading' || loading) {
    return <SpinningLoader loading={true} />;
  }

  if (error) {
    return (
      <div className='flex justify-center align-middle'>
        <div>Error: {error}</div>
        <div className="mt-4">
          <Button onClick={() => router.push(`/groups/`)}>Go back to groups</Button>
        </div>
      </div>
    );
  }

  return null;
}
