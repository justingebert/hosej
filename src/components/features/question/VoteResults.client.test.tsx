import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CountUpBadge } from "@/components/features/question/VoteResults.client";

describe("CountUpBadge", () => {
    it("counts up to the target percentage", () => {
        vi.useFakeTimers();
        render(<CountUpBadge targetPercentage={50} />);

        expect(screen.getByText("0 %")).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText("50 %")).toBeInTheDocument();
        vi.useRealTimers();
    });
});
