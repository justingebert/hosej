"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useToast } from '@/hooks/use-toast';

export default function JoinGroup({ params }: { params: { id: string }; }) {
  const { session, status, user } = useAuthRedirect();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    if (status === "loading") return; 

    const groupId = params.id;
    if (!groupId) {
      setError('Missing  group ID');
      return;
    }

    const joinGroup = async () => {
      try {
        const res:any = await fetch('/api/groups/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId,
            userId: (session?.user as any)._id,
          }),
        }) as any;
        if(res.status === 400){
          console.log(res);
          toast({
            title: "Error",
            description: "You are already a member of this group",
            variant: "destructive",
          });
          setLoading(false);
          router.push(`/groups/`);
        }

        const joinedGroup = await res.json();
        setGroup(joinedGroup);
        setLoading(false);
        router.push(`/groups/`);
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
