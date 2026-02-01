"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

interface GlobalFeatureControlProps {
    config: GlobalConfig;
    localConfig: GlobalConfig;
    onUpdateFeature: (feature: 'questions' | 'rallies' | 'jukebox', status: FeatureStatus) => void;
    onSave: () => void;
    saving: boolean;
}

export default function GlobalFeatureControl({
    config,
    localConfig,
    onUpdateFeature,
    onSave,
    saving,
}: GlobalFeatureControlProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Global Feature Control</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <FeatureRadioGroup
                        label="Questions"
                        id="q"
                        value={localConfig.features.questions.status}
                        onChange={(status) => onUpdateFeature('questions', status)}
                    />

                    <FeatureRadioGroup
                        label="Rallies"
                        id="r"
                        value={localConfig.features.rallies.status}
                        onChange={(status) => onUpdateFeature('rallies', status)}
                    />

                    <FeatureRadioGroup
                        label="Jukebox"
                        id="j"
                        value={localConfig.features.jukebox.status}
                        onChange={(status) => onUpdateFeature('jukebox', status)}
                    />
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t">
                    <Button
                        onClick={onSave}
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
    );
}

function FeatureRadioGroup({
    label,
    id,
    value,
    onChange,
}: {
    label: string;
    id: string;
    value: FeatureStatus;
    onChange: (status: FeatureStatus) => void;
}) {
    return (
        <div className="p-3 md:p-4 border rounded-lg space-y-3">
            <div className="space-y-0.5">
                <Label className="text-base font-semibold">{label}</Label>
            </div>
            <RadioGroup
                value={value}
                onValueChange={(v) => onChange(v as FeatureStatus)}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enabled" id={`${id}-enabled`} />
                    <Label htmlFor={`${id}-enabled`} className="cursor-pointer">Enabled</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comingSoon" id={`${id}-coming`} />
                    <Label htmlFor={`${id}-coming`} className="cursor-pointer">Coming Soon</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="disabled" id={`${id}-disabled`} />
                    <Label htmlFor={`${id}-disabled`} className="cursor-pointer">Disabled</Label>
                </div>
            </RadioGroup>
        </div>
    );
}
