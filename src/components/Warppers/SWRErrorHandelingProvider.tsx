"use client";

import { SWRConfig } from "swr";
import { useToast } from "@/hooks/use-toast";
import { ReactNode } from "react";

export default function SWRErrorHandlingProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();

    return (
        <SWRConfig
            value={{
                onError: (error, key) => {
                    const resource = "data";
                    toast({
                        title: `Failed to fetch ${resource}`,
                        description: "Please try again later",
                        variant: "destructive",
                    });
                },
                errorRetryCount: 3,
            }}
        >
            {children}
        </SWRConfig>
    );
}
