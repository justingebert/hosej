'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home } from 'lucide-react';
import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";

export default function Error({
                                  error,
                                  reset,
                              }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error);
    }, [error]);

    const handleGoHome = () => {
        router.push('/groups');
    };

    return (
        <div className="flex flex-col h-[100dvh]">
            <Header leftComponent={<BackLink href={`/groups`}/>}/>
            <div className="flex items-center justify-center flex-1">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-destructive mb-2">
                            <AlertCircle className="h-6 w-6"/>
                            <CardTitle>Something went wrong!</CardTitle>
                        </div>
                        <CardDescription>
                            An unexpected error occurred.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {process.env.NODE_ENV === 'development' && (
                            <div className="rounded-md bg-muted p-3 text-xs font-mono break-all">
                                {error.message}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button
                                onClick={reset}
                                variant="outline"
                                className="flex-1"
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={handleGoHome}
                                className="flex-1 gap-2"
                            >
                                <Home className="h-4 w-4"/>
                                Go to Home
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

