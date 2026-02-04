import { render, screen } from "@testing-library/react";
import Header from "@/components/ui/custom/Header";
import { describe, expect, it } from "vitest";

describe("Header", () => {
    it("renders a skeleton when title is null", () => {
        const { container } = render(<Header title={null} />);
        expect(container.querySelector(".animate-pulse")).toBeTruthy();
    });

    it("renders a title when provided", () => {
        render(<Header title="Settings" />);
        expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    });

    it("renders no skeleton when title is omitted", () => {
        const { container } = render(<Header />);
        expect(container.querySelector(".animate-pulse")).toBeFalsy();
    });
});
