"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function JoinGroup({ params }: { params: { id: string }; }) {
  const { session, status } = useAuthRedirect();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false); // New state to track if joined successfully
  const { toast } = useToast();

  useEffect(() => {
    if (status === "loading" || loading || joined) return; // Prevent re-running if already loading or joined

    const groupId = params.id;
    if (!groupId) {
      setError('Missing group ID');
      return;
    }

    const joinGroup = async () => {
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

        if (res.status === 400 || responseData.message === "User is already a member of this group") {
          toast({
            title: "Error",
            description: "You are already a member of this group",
            variant: "destructive",
          });
          setLoading(false);
          router.push(`/groups/`);
          return;
        }

        // Success: only push route and show success toast if first join
        if (res.ok) {
          setJoined(true);
          toast({
            title: "Success",
            description: "Successfully joined the group",
            variant: "default",
          });
          router.push(`/groups/`);
        }
      } catch (error: any) {
        setError("Failed to join group: " + error.message);
      } finally {
        setLoading(false); // Ensure loading is reset
      }
    };

    if (session?.user && groupId) {
      joinGroup();
    }
  }, [session?.user, status, params.id, loading, joined]); // Add `joined` to dependencies

  if (status === 'loading' || loading) {
    return <Loader loading={true} />;
  }

  if (error) {
    console.error('Failed to join group:', error);
    return <div className='flex justify-center align-middle'>
      <div>Error: {error}</div>
      <div className="mt-4">
        <Button onClick={() => router.push(`/groups/`)}>Go back to groups</Button>
      </div>
      </div>;
  }

  return null; 
}
