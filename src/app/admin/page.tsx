"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Shield } from "lucide-react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { FeatureStatus } from "@/types/models/appConfig";
import TemplateUploadCard from "@/components/admin/TemplateUploadCard";
import GlobalFeatureControl from "@/components/admin/GlobalFeatureControl";

interface GlobalConfig {
    features: {
        questions: { status: FeatureStatus };
        rallies: { status: FeatureStatus };
        jukebox: { status: FeatureStatus };
    };
    adminUsers: string[];
    updatedAt: string;
}

export default function AdminPage() {
    const { user } = useAuthRedirect();
    const router = useRouter();
    const { toast } = useToast();
    const [localConfig, setLocalConfig] = useState<GlobalConfig | null>(null);
    const [saving, setSaving] = useState(false);

    const { data: config, error, isLoading, mutate } = useSWR<GlobalConfig>(
        user ? "/api/admin/config" : null,
        fetcher
    );

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

    // Initialize local config when data loads
    useEffect(() => {
        if (config) {
            setLocalConfig(config);
        }
    }, [config]);

    const updateFeature = (feature: 'questions' | 'rallies' | 'jukebox', status: FeatureStatus) => {
        if (!localConfig) return;

        setLocalConfig({
            ...localConfig,
            features: {
                ...localConfig.features,
                [feature]: { status },
            },
        });
    };

    const saveSettings = async () => {
        if (!localConfig) return;

        setSaving(true);
        try {
            const response = await fetch("/api/admin/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ features: localConfig.features }),
            });

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to save settings",
                    variant: "destructive",
                });
                return
            }

            const updated = await response.json();

            // Update SWR cache with new data
            mutate(updated, false);
            setLocalConfig(updated);

            toast({
                title: "Settings Saved",
                description: "Global feature settings have been updated",
            });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({
                title: "Error",
                description: "Failed to save settings",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container max-w-4xl mx-auto py-8 space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!config || !localConfig) {
        return null;
    }

    return (
        <div className="container max-w-4xl mx-auto py-4 md:py-8 px-4 space-y-4 md:space-y-6">
            <div className="flex items-center gap-2 md:gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push("/groups")}
                >
                    <ArrowLeft />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 md:h-6 md:w-6" />
                        <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
                    </div>
                </div>
            </div>

            <GlobalFeatureControl
                config={config}
                localConfig={localConfig}
                onUpdateFeature={updateFeature}
                onSave={saveSettings}
                saving={saving}
            />

            <TemplateUploadCard />
        </div>
    );
}
