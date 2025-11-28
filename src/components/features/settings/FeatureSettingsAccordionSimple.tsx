import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FeatureStatus } from "@/types/models/appConfig";
import { ReactNode } from "react";

interface FeatureSettingsAccordionSimpleProps {
    featureName: string;
    featureKey: 'questions' | 'rallies' | 'jukebox';
    globalStatus?: FeatureStatus;
    description: string;
    children?: ReactNode;
}

export function FeatureSettingsAccordionSimple({
                                                   featureName,
                                                   featureKey,
                                                   globalStatus,
                                                   description,
                                                   children
                                               }: FeatureSettingsAccordionSimpleProps) {
    const isGloballyEnabled = globalStatus === 'enabled';

    // Don't render if feature is not enabled globally
    if (!isGloballyEnabled) {
        return null;
    }

    return (
        <AccordionItem value={featureKey}>
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    {featureName}
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">{description}</p>
                    {children}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
