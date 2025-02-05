"use client"

import { useEffect } from 'react';
import { useRouter } from "next/navigation";
import SpinningLoader from '@/components/ui/custom/SpinningLoader';
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
      console.log('Device ID:', deviceId);
      console.log(user)
      if (deviceId && status === 'authenticated') {
        try {
          const response = await fetch('/api/auth/google/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: deviceId, googleUserId: user._id }),
          });

          const result = await response.json();
          console.log('Google account link response:', result);

          if (response.ok) {
            console.log('Google account linked successfully.');
            toast({ title: "Google account linked successfully." });
            await signIn('google', { callbackUrl: `/groups` })
            console.log('Redirecting to groups page');
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
    return <SpinningLoader loading={true} />;
  }

  return <SpinningLoader loading={true} />; 
}
