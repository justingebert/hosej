import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FeatureStatus } from "@/types/models/appConfig";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface FeatureSettingsAccordionSimpleProps {
    featureName: string;
    featureKey: "questions" | "rallies" | "jukebox";
    globalStatus?: FeatureStatus;
    icon?: LucideIcon;
    summary?: string;
    children?: ReactNode;
}

export function FeatureSettingsAccordionSimple({
    featureName,
    featureKey,
    globalStatus,
    icon: Icon,
    summary,
    children,
}: FeatureSettingsAccordionSimpleProps) {
    const isGloballyEnabled = globalStatus === "enabled";

    // Don't render if feature is not enabled globally
    if (!isGloballyEnabled) {
        return null;
    }

    return (
        <AccordionItem value={featureKey}>
            <AccordionTrigger>
                <div className="flex flex-1 items-center justify-between gap-3 pr-2">
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                        <span>{featureName}</span>
                    </div>
                    {summary && (
                        <span className="text-xs font-normal text-muted-foreground truncate">
                            {summary}
                        </span>
                    )}
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2">{children}</div>
            </AccordionContent>
        </AccordionItem>
    );
}
