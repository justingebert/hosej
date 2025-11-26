"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { FeatureStatus } from "@/types/models/appConfig";

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
                throw new Error("Failed to save settings");
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

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Global Feature Control</CardTitle>
                            <CardDescription>
                                Enable or disable features system-wide. Disabled features will not be available in any group.
                            </CardDescription>
                        </div>
                        <Badge variant="secondary">Admin</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="p-3 md:p-4 border rounded-lg space-y-3">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">
                                    Questions
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Daily questions and voting system
                                </p>
                            </div>
                            <RadioGroup
                                value={localConfig.features.questions.status}
                                onValueChange={(value) => updateFeature('questions', value as FeatureStatus)}
                                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="enabled" id="q-enabled" />
                                    <Label htmlFor="q-enabled" className="cursor-pointer">Enabled</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="comingSoon" id="q-coming" />
                                    <Label htmlFor="q-coming" className="cursor-pointer">Coming Soon</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="disabled" id="q-disabled" />
                                    <Label htmlFor="q-disabled" className="cursor-pointer">Disabled</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="p-3 md:p-4 border rounded-lg space-y-3">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">
                                    Rallies
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Photo rallies and challenges
                                </p>
                            </div>
                            <RadioGroup
                                value={localConfig.features.rallies.status}
                                onValueChange={(value) => updateFeature('rallies', value as FeatureStatus)}
                                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="enabled" id="r-enabled" />
                                    <Label htmlFor="r-enabled" className="cursor-pointer">Enabled</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="comingSoon" id="r-coming" />
                                    <Label htmlFor="r-coming" className="cursor-pointer">Coming Soon</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="disabled" id="r-disabled" />
                                    <Label htmlFor="r-disabled" className="cursor-pointer">Disabled</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="p-3 md:p-4 border rounded-lg space-y-3">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">
                                    Jukebox
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Music submission and rating system
                                </p>
                            </div>
                            <RadioGroup
                                value={localConfig.features.jukebox.status}
                                onValueChange={(value) => updateFeature('jukebox', value as FeatureStatus)}
                                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="enabled" id="j-enabled" />
                                    <Label htmlFor="j-enabled" className="cursor-pointer">Enabled</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="comingSoon" id="j-coming" />
                                    <Label htmlFor="j-coming" className="cursor-pointer">Coming Soon</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="disabled" id="j-disabled" />
                                    <Label htmlFor="j-disabled" className="cursor-pointer">Disabled</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t">
                        <Button
                            onClick={saveSettings}
                            disabled={saving}
                            size="lg"
                            className="w-full"
                        >
                            {saving ? "Saving..." : "Save Global Settings"}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Last updated: {new Date(config.updatedAt).toLocaleString()}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

