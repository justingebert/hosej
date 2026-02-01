import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { FeatureStatus } from "@/types/models/appConfig";
import type { ReactNode } from "react";

interface FeatureSettingsAccordionProps {
    featureName: string;
    featureKey: "questions" | "rallies" | "jukebox";
    globalStatus?: FeatureStatus;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    description: string;
    children?: ReactNode;
}

export function FeatureSettingsAccordion({
    featureName,
    featureKey,
    globalStatus,
    enabled,
    onToggle,
    description,
    children,
}: FeatureSettingsAccordionProps) {
    const isGloballyEnabled = globalStatus === "enabled";
    const isComingSoon = globalStatus === "comingSoon";
    const isDisabled = globalStatus === "disabled";

    return (
        <AccordionItem value={featureKey}>
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    {featureName}
                    {isComingSoon && <Badge variant="secondary">Coming Soon</Badge>}
                    {isDisabled && <Badge variant="destructive">Globally Disabled</Badge>}
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor={`feature-${featureKey}`}>Enable for this Group</Label>
                            <p className="text-sm text-muted-foreground">
                                {isGloballyEnabled
                                    ? description
                                    : `Feature is ${isComingSoon ? "coming soon" : "globally disabled"}`}
                            </p>
                        </div>
                        <Switch
                            id={`feature-${featureKey}`}
                            checked={enabled}
                            onCheckedChange={onToggle}
                            disabled={!isGloballyEnabled}
                        />
                    </div>

                    {isGloballyEnabled && enabled && children && (
                        <div className="pt-2 border-t">{children}</div>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
