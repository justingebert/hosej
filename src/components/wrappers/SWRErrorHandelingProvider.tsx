"use client";

import { SWRConfig } from "swr";
import { useToast } from "@/hooks/use-toast";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { FetchError } from "@/lib/fetcher";

export default function SWRErrorHandlingProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const router = useRouter();

    return (
        <SWRConfig
            value={{
                dedupingInterval: 10_000,
                focusThrottleInterval: 30_000,
                keepPreviousData: true,
                onError: (error: FetchError, key) => {
                    // Handle 404 errors - redirect to groups page
                    if (error.status === 404) {
                        toast({
                            title: "Not Found",
                            description: "The resource you're looking for doesn't exist",
                            variant: "destructive",
                        });
                        router.push("/groups");
                        return;
                    }

                    // Handle 403 Forbidden - redirect to groups page
                    if (error.status === 403) {
                        toast({
                            title: "Access Denied",
                            description: "You don't have permission to access this resource",
                            variant: "destructive",
                        });
                        router.push("/groups");
                        return;
                    }

                    // Handle 400 Bad Request - redirect to groups page
                    if (error.status === 400) {
                        toast({
                            title: "Invalid Request",
                            description: "The request is invalid",
                            variant: "destructive",
                        });
                        router.push("/groups");
                        return;
                    }

                    // For other errors, show a generic error message
                    toast({
                        title: "Failed to fetch data",
                        description: error.message || "Please try again later",
                        variant: "destructive",
                    });
                },
                errorRetryCount: 3,
                shouldRetryOnError: (error: FetchError) => {
                    // Don't retry on client errors (4xx)
                    return !(error.status >= 400 && error.status < 500);
                },
            }}
        >
            {children}
        </SWRConfig>
    );
}
