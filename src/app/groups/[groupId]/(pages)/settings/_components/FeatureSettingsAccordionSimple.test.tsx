import { render, screen, fireEvent } from "@testing-library/react";
import { Accordion } from "@/components/ui/accordion";
import { FeatureSettingsAccordionSimple } from "@/app/groups/[groupId]/(pages)/settings/_components/FeatureSettingsAccordionSimple";
import { describe, expect, it } from "vitest";

describe("FeatureSettingsAccordionSimple", () => {
    it("renders and expands to reveal its settings", () => {
        render(
            <Accordion type="single" collapsible>
                <FeatureSettingsAccordionSimple featureName="Questions" featureKey="questions">
                    <div>Child content</div>
                </FeatureSettingsAccordionSimple>
            </Accordion>
        );

        const trigger = screen.getByRole("button", { name: /questions/i });
        fireEvent.click(trigger);

        expect(screen.getByText("Child content")).toBeInTheDocument();
    });
});
