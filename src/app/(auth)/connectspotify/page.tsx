"use client"

import { useEffect } from 'react';
import { useRouter } from "next/navigation";
import SpinningLoader from '@/components/ui/custom/SpinningLoader';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { signIn } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import Cookies from "js-cookie";

export default function SpotifyCallbackPage() {
    const { session, status, user } = useAuthRedirect();
    const router = useRouter();
    const { toast } = useToast();

  useEffect(() => {
    const mergeGoogleAccount = async () => {
      const originalUserId = Cookies.get('originalUserId');
      if (originalUserId && status === 'authenticated') {
        try {
          const response = await fetch('/api/auth/spotify/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: originalUserId, spotifyUserId: user._id }),
          });

          const result = await response.json();

          if (response.ok) {
            console.log('Spotify account linked successfully.');
            toast({ title: "Spotify account linked successfully." });
            await signIn(result.provider, { callbackUrl: `/settings` })
            console.log('Redirecting to groups page');
          } else {
            toast({ title: `Spotify account linked failed: ${result.message}` });
          }
        } catch (error) {
          console.error('Error merging accounts:', error);
        } finally {
          Cookies.remove('originalUserId');
          router.push('/settings');
        }
      }
    };

    if (status === 'authenticated') {
      mergeGoogleAccount();
    }
  }, [status, session, router]);

  return <SpinningLoader loading={true} />; 
}
