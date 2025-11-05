'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, SearchX } from 'lucide-react';
import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";

export default function NotFound() {
    const router = useRouter();

    // Auto-redirect after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/groups');
        }, 5000);

        return () => clearTimeout(timer);
    }, [router]);

    const handleGoHome = () => {
        router.push('/groups');
    };

    return (
        <div className="flex flex-col h-[100dvh]">
            <Header leftComponent={<BackLink href={`/groups`} />} />
            <div className="flex items-center justify-center flex-1">
                <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <SearchX className="h-6 w-6" />
                        <CardTitle>Page Not Found</CardTitle>
                    </div>
                    <CardDescription>
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                        <br />
                        <span className="text-xs text-muted-foreground mt-2 block">
                            Redirecting to groups in 5 seconds...
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleGoHome}
                        className="w-full gap-2"
                    >
                        <Home className="h-4 w-4" />
                        Go to Home Now
                    </Button>
                </CardContent>
            </Card>
            </div>
        </div>
    );
}

