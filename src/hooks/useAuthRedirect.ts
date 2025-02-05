import { useEffect } from 'react';
import { useSession, signIn } from "next-auth/react";
import { IUser } from '@/db/models/user';

export function useAuthRedirect() {
  const { data: session, status, update } = useSession();;

  useEffect(() => {
    if (status === 'loading') return; 
    if (!session) signIn();
  }, [status, session]);

  const user = session?.user as IUser 

  return { session, status, user, update };
}
