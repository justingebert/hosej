import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DisplayOptions } from "@/components/features/question/createQuestion.client";

describe("DisplayOptions", () => {
    it("renders static options as disabled inputs", () => {
        render(
            <DisplayOptions
                mode="static"
                options={["A", "B"]}
                clearInput={false}
                onOptionChange={() => {}}
                onOptionRemove={() => {}}
                onOptionAdd={() => {}}
                onOptionImageAdded={() => {}}
            />
        );

        expect(screen.getByDisplayValue("A")).toBeDisabled();
        expect(screen.getByDisplayValue("B")).toBeDisabled();
    });

    it("calls onOptionAdd when pressing Enter in editable mode", () => {
        const onOptionAdd = vi.fn();

        render(
            <DisplayOptions
                mode="editable"
                options={[""]}
                clearInput={false}
                onOptionChange={() => {}}
                onOptionRemove={() => {}}
                onOptionAdd={onOptionAdd}
                onOptionImageAdded={() => {}}
            />
        );

        const input = screen.getByPlaceholderText("Option 1");
        fireEvent.keyDown(input, { key: "Enter" });
        expect(onOptionAdd).toHaveBeenCalledTimes(1);
    });
});
