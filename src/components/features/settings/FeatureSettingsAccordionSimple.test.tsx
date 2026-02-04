import { render, screen, fireEvent } from "@testing-library/react";
import { Accordion } from "@/components/ui/accordion";
import { FeatureSettingsAccordionSimple } from "@/components/features/settings/FeatureSettingsAccordionSimple";
import { describe, expect, it } from "vitest";

describe("FeatureSettingsAccordionSimple", () => {
    it("does not render when global status is not enabled", () => {
        render(
            <Accordion type="single" collapsible>
                <FeatureSettingsAccordionSimple
                    featureName="Questions"
                    featureKey="questions"
                    globalStatus="comingSoon"
                >
                    <div>Child</div>
                </FeatureSettingsAccordionSimple>
            </Accordion>
        );

        expect(screen.queryByRole("button", { name: /questions/i })).not.toBeInTheDocument();
    });

    it("renders and expands when globally enabled", () => {
        render(
            <Accordion type="single" collapsible>
                <FeatureSettingsAccordionSimple
                    featureName="Questions"
                    featureKey="questions"
                    globalStatus="enabled"
                >
                    <div>Child content</div>
                </FeatureSettingsAccordionSimple>
            </Accordion>
        );

        const trigger = screen.getByRole("button", { name: /questions/i });
        fireEvent.click(trigger);

        expect(screen.getByText("Configure questions")).toBeInTheDocument();
        expect(screen.getByText("Child content")).toBeInTheDocument();
    });
});
