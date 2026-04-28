"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
    clearStoredConsent,
    getStoredConsent,
    setStoredConsent,
    type ConsentStatus,
} from "@/lib/consent/consent";

type ConsentContextValue = {
    status: ConsentStatus;
    grant: () => void;
    deny: () => void;
    reset: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<ConsentStatus>("unknown");

    useEffect(() => {
        setStatus(getStoredConsent());
    }, []);

    const grant = useCallback(() => {
        setStoredConsent("granted");
        setStatus("granted");
    }, []);

    const deny = useCallback(() => {
        setStoredConsent("denied");
        setStatus("denied");
    }, []);

    const reset = useCallback(() => {
        clearStoredConsent();
        setStatus("unknown");
    }, []);

    return (
        <ConsentContext.Provider value={{ status, grant, deny, reset }}>
            {children}
        </ConsentContext.Provider>
    );
}

export function useConsent() {
    const ctx = useContext(ConsentContext);
    if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
    return ctx;
}
