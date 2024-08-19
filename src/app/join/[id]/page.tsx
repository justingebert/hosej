"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';
import { Button } from '@/components/ui/button';

export default function JoinGroup({ params }: { params: { id: string }; }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return; // Don't run the effect until user loading is complete

    const groupId = params.id;
    if (!user || !groupId) {
      setError('Missing user or group ID');
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
            userId: user._id,
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

    joinGroup();
  }, [loading, user, params.id]);

  if (loading) {
    return <div>Loading user data...</div>;
  }

  if (error) {
    console.error('Failed to join group:', error);
    return <div>Error: {error}</div>;
  }

  if (!group) {
    return <div>Joining group...</div>;
  }

  return (
    <div>
      <h2>Successfully joined {group.name}</h2>
      <Button onClick={() => router.push('/')}>Go to Groups</Button>
    </div>
  );
}
