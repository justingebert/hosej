"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Loader from '@/components/ui/Loader';
import { useSession } from 'next-auth/react';
import { set } from 'mongoose';


export default function JoinGroup({ params }: { params: { id: string }; }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (status === "loading") return; 

    const groupId = params.id;
    if (!groupId) {
      setError('Missing  group ID');
      return;
    }

    if (!session?.user) {
      router.push(`/?groupId=${groupId}`);
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
        setLoading(false);
      } catch (error: any) {
        setError(error.message);
        setLoading(false);
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
    return <Loader loading={true} />;
  }

  if(loading) {
    return <Loader loading={true} />;
  }

  return (
    <>
    </>
  );
}
