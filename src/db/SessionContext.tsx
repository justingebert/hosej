import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

// Create a context to store the session data
const SessionContext = createContext(null);

export function SessionProvider({ children }:any) {
  const { data: session, status } = useSession();
  const [sessionData, setSessionData] = useState({
    session: null,
    status: 'loading',
  });

  useEffect(() => {
    setSessionData({ session, status });
  }, [session, status]);

  return (
    <SessionContext.Provider value={sessionData}>
      {children}
    </SessionContext.Provider>
  );
}

// Custom hook to use the session context
export function useCustomSession() {
  return useContext(SessionContext);
}
