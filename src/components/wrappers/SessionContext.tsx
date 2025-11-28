import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

// Define the interface for session data
interface SessionData {
    session: any;
    status: string;
}

const SessionContext = createContext<SessionData | null>(null);

export function SessionProvider({children}: any) {
    const {data: session, status} = useSession();
    const [sessionData, setSessionData] = useState<SessionData>({
        session: null,
        status: 'loading',
    });

    useEffect(() => {
        setSessionData({session, status});
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
