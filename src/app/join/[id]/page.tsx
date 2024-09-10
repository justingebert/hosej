"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import Loader from '@/components/ui/Loader';
import { useSession } from 'next-auth/react';


export default function JoinGroup({ params }: { params: { id: string }; }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return; // Don't run the effect until user loading is complete

    const groupId = params.id;
    if (!groupId) {
      setError('Missing  group ID');
      return;
    }

    if (!session?.user) {
      router.push(`/api/auth/signin?callbackUrl=/join/${groupId}`);
      return;
    }

    const joinGroup = async () => {
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

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to join group');
        }

        const joinedGroup = await res.json();
        setGroup(joinedGroup);
      } catch (error: any) {
        setError(error.message);
      }
    };
    if (session?.user && groupId) {
      joinGroup();
    }
  }, [session, status, params.id]);

  if (status === 'loading') {
    return <Loader loading={true} />;
  }

  if (error) {
    console.error('Failed to join group:', error);
    return <div>Error: {error}</div>;
  }

  if (!group) {
    return <div>Joining group...</div>;
  }

  return (
    <div className='flex flex-col justify-between text-center'>
      <h2>Successfully joined {group.name}</h2>
      <Button onClick={() => router.push('/groups')}>Go to Groups</Button>
    </div>
  );
}
