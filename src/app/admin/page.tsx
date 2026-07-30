"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import TemplateUploadCard from "@/app/admin/_components/TemplateUploadCard";
import GroupPackManager from "@/app/admin/_components/GroupPackManager";
import PackLifecycleCard from "@/app/admin/_components/PackLifecycleCard";
import Header from "@/components/ui/custom/Header";
import BackLink from "@/components/ui/custom/BackLink";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

interface GlobalConfig {
    adminUsers: string[];
    updatedAt: string;
}

export default function AdminPage() {
    const { user } = useAuthRedirect();
    const router = useRouter();
    const { toast } = useToast();
    const {
        data: config,
        error,
        isLoading,
    } = useSWR<GlobalConfig>(user ? "/api/admin/config" : null, fetcher);

    // Check for 403 error and redirect
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
                description: "Failed to load admin configuration",
                variant: "destructive",
            });
            router.push("/groups");
        }
    }, [error, router, toast]);

    if (isLoading) {
        return (
            <div className="container max-w-4xl mx-auto py-8 space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!config) {
        return null;
    }

    return (
        <>
            <Header title="Admin Panel" leftComponent={<BackLink href={`/settings`} />} />

            <div className="space-y-4 pb-12">
                <GroupPackManager />

                <PackLifecycleCard />

                <TemplateUploadCard />

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/admin/announcements")}
                >
                    <Megaphone className="mr-2" />
                    Announcements
                </Button>
            </div>
        </>
    );
}
