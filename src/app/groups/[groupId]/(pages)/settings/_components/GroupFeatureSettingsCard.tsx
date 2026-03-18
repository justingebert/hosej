"use client";

import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureSettingsAccordionSimple } from "@/app/groups/[groupId]/(pages)/settings/_components/FeatureSettingsAccordionSimple";
import { JukeboxSettings } from "@/app/groups/[groupId]/(pages)/settings/_components/JukeboxSettings";
import { QuestionSettings } from "@/app/groups/[groupId]/(pages)/settings/_components/QuestionSettings";
import { RallySettings } from "@/app/groups/[groupId]/(pages)/settings/_components/RallySettings";
import type { FeatureStatus } from "@/types/models/appConfig";
import type { GroupDTO } from "@/types/models/group";

type GlobalFeatures = Partial<Record<keyof GroupDTO["features"], { status: FeatureStatus }>>;

export function GroupFeatureSettingsCard({
    groupId,
    features,
    globalFeatures,
    onQuestionCountChange,
    onRallyCountChange,
    onRallyGapDaysChange,
    onJukeboxConcurrentChange,
    onJukeboxActivationDaysChange,
}: {
    groupId: string;
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
                            groupId={groupId}
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
