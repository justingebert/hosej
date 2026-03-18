import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FeatureStatus } from "@/types/models/appConfig";
import type { ReactNode } from "react";

interface FeatureSettingsAccordionSimpleProps {
    featureName: string;
    featureKey: "questions" | "rallies" | "jukebox";
    globalStatus?: FeatureStatus;
    children?: ReactNode;
}

export function FeatureSettingsAccordionSimple({
    featureName,
    featureKey,
    globalStatus,
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
                <div className="flex items-center gap-2">{featureName}</div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2">{children}</div>
            </AccordionContent>
        </AccordionItem>
    );
}
