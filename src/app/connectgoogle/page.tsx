"use client"

import { useEffect } from 'react';
import { useRouter } from "next/navigation";
import Loader from '@/components/ui/Loader';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { signIn } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

export default function GoogleCallbackPage() {
    const { session, status, user } = useAuthRedirect();
    const router = useRouter();
    const { toast } = useToast();

  useEffect(() => {
    const mergeGoogleAccount = async () => {

      const deviceId = localStorage.getItem('deviceId');

      if (deviceId && status === 'authenticated' && user?.googleId) {
        try {
          const response = await fetch('/api/google/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: deviceId, googleUserId: user._id }),
          });

          const result = await response.json();

          if (result.success) {
            console.log('Google account linked successfully.');
            toast({ title: "Google account linked successfully." });
            await signIn('google', { callbackUrl: `/groups` })
          } else {
            console.error('Failed to link Google account:', result.message);
          }
        } catch (error) {
          console.error('Error merging accounts:', error);
        }
      }
    };

    if (status === 'authenticated') {
      mergeGoogleAccount();
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <Loader loading={true} />;
  }

  return <Loader loading={true} />; 
}
