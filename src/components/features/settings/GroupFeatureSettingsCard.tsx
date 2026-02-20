"use client";

import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureSettingsAccordionSimple } from "@/components/features/settings/FeatureSettingsAccordionSimple";
import { JukeboxSettings } from "@/components/features/settings/JukeboxSettings";
import { QuestionSettings } from "@/components/features/settings/QuestionSettings";
import { RallySettings } from "@/components/features/settings/RallySettings";
import type { FeatureStatus } from "@/types/models/appConfig";
import type { GroupDTO } from "@/types/models/group";

type GlobalFeatures = Partial<Record<keyof GroupDTO["features"], { status: FeatureStatus }>>;

export function GroupFeatureSettingsCard({
    features,
    globalFeatures,
    onQuestionCountChange,
    onRallyCountChange,
    onRallyGapDaysChange,
    onJukeboxConcurrentChange,
    onJukeboxActivationDaysChange,
}: {
    features: GroupDTO["features"];
    globalFeatures?: GlobalFeatures;
    onQuestionCountChange: (value: number) => void;
    onRallyCountChange: (value: number) => void;
    onRallyGapDaysChange: (value: number) => void;
    onJukeboxConcurrentChange: (value: string[]) => void;
    onJukeboxActivationDaysChange: (value: number[]) => void;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Feature Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <FeatureSettingsAccordionSimple
                        featureName="Questions"
                        featureKey="questions"
                        globalStatus={globalFeatures?.questions?.status}
                    >
                        <QuestionSettings
                            questionCount={features.questions.settings.questionCount}
                            lastQuestionDate={features.questions.settings.lastQuestionDate}
                            onQuestionCountChange={onQuestionCountChange}
                        />
                    </FeatureSettingsAccordionSimple>

                    <FeatureSettingsAccordionSimple
                        featureName="Rallies"
                        featureKey="rallies"
                        globalStatus={globalFeatures?.rallies?.status}
                    >
                        <RallySettings
                            rallyCount={features.rallies.settings.rallyCount}
                            rallyGapDays={features.rallies.settings.rallyGapDays}
                            onRallyCountChange={onRallyCountChange}
                            onRallyGapDaysChange={onRallyGapDaysChange}
                        />
                    </FeatureSettingsAccordionSimple>

                    <FeatureSettingsAccordionSimple
                        featureName="Jukebox"
                        featureKey="jukebox"
                        globalStatus={globalFeatures?.jukebox?.status}
                    >
                        <JukeboxSettings
                            concurrent={features.jukebox.settings.concurrent}
                            activationDays={features.jukebox.settings.activationDays}
                            onConcurrentChange={onJukeboxConcurrentChange}
                            onActivationDaysChange={onJukeboxActivationDaysChange}
                        />
                    </FeatureSettingsAccordionSimple>
                </Accordion>
            </CardContent>
        </Card>
    );
}
