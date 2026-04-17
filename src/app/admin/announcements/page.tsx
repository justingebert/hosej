"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/ui/custom/Header";
import BackLink from "@/components/ui/custom/BackLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnnouncementAggregate, InputAggregate } from "@/lib/services/announcements/aggregate";

function InputBlock({ input }: { input: InputAggregate }) {
    if (input.kind === "choice") {
        const total = Object.values(input.counts).reduce((a, b) => a + b, 0);
        return (
            <div className="flex flex-col gap-2">
                {Object.entries(input.counts).map(([value, count]) => {
                    const pct = total === 0 ? 0 : Math.round((count / total) * 100);
                    return (
                        <div key={value} className="flex flex-col gap-1">
                            <div className="flex justify-between text-sm">
                                <span>{value}</span>
                                <span className="text-muted-foreground">
                                    {count} ({pct}%)
                                </span>
                            </div>
                            <Progress value={pct} />
                        </div>
                    );
                })}
            </div>
        );
    }

    if (input.kind === "thumbs") {
        return (
            <div className="flex gap-4 text-sm">
                <span>👍 {input.up}</span>
                <span>👎 {input.down}</span>
            </div>
        );
    }

    if (input.kind === "stars") {
        return (
            <div className="flex flex-col gap-2">
                <div className="text-sm text-muted-foreground">
                    Average: {input.average.toFixed(2)} / 5
                </div>
                <div className="flex flex-col gap-1">
                    {([5, 4, 3, 2, 1] as const).map((n) => {
                        const total = Object.values(input.counts).reduce((a, b) => a + b, 0);
                        const count = input.counts[n];
                        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
                        return (
                            <div key={n} className="flex items-center gap-2 text-sm">
                                <span className="w-10">{n}★</span>
                                <Progress value={pct} className="flex-grow" />
                                <span className="w-12 text-right text-muted-foreground">
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (input.comments.length === 0) {
        return <p className="text-sm text-muted-foreground">No comments yet.</p>;
    }

    return (
        <ul className="flex flex-col gap-2">
            {input.comments.map((c, idx) => (
                <li key={idx} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">{c.username}</div>
                    <div className="text-muted-foreground">{c.text}</div>
                </li>
            ))}
        </ul>
    );
}

export default function AdminAnnouncementsPage() {
    const { user } = useAuthRedirect();
    const router = useRouter();
    const { toast } = useToast();

    const { data, error, isLoading } = useSWR<{ announcements: AnnouncementAggregate[] }>(
        user ? "/api/admin/announcements" : null,
        fetcher
    );

    useEffect(() => {
        if (error && error.status === 403) {
            toast({
                title: "Access Denied",
                description: "You are not authorized to access this page",
                variant: "destructive",
            });
            router.push("/groups");
        } else if (error) {
            toast({
                title: "Error",
                description: "Failed to load announcements",
                variant: "destructive",
            });
        }
    }, [error, router, toast]);

    if (isLoading) {
        return (
            <>
                <Header title="Announcements" leftComponent={<BackLink href="/admin" />} />
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </>
        );
    }

    if (!data) return <div>NONO</div>;

    return (
        <>
            <Header title="Announcements" leftComponent={<BackLink href="/admin" />} />

            {data.announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements in the registry.</p>
            ) : (
                <div className="space-y-4">
                    {data.announcements.map((a) => (
                        <Card key={a.id}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>{a.title}</span>
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {a.kind}
                                    </span>
                                </CardTitle>
                                <div className="text-xs text-muted-foreground font-mono">
                                    {a.id}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4 text-sm">
                                    <span>Seen: {a.seenCount}</span>
                                    {a.kind === "feedback" && (
                                        <span>Responses: {a.responseCount}</span>
                                    )}
                                </div>
                                {a.inputs.map((input) => (
                                    <div key={input.id} className="space-y-2">
                                        <div className="text-sm font-medium">{input.id}</div>
                                        <InputBlock input={input} />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </>
    );
}
