import { useEffect } from 'react';
import { useSession, signIn } from "next-auth/react";
import { IUser } from '@/db/models/user';

export function useAuthRedirect() {
  const { data: session, status } = useSession();;

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading
    if (!session) signIn();
  }, [status, session]);

  const user = session?.user as IUser 

  return { session, status, user };
}
