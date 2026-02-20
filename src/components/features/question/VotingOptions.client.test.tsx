import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VoteOptions from "@/components/features/question/VotingOptions.client";
import type { QuestionOptionDTO } from "@/types/models/question";
import { QuestionType } from "@/types/models/question";

describe("VotingOptions", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("submits a single-select vote", async () => {
        const fetchMock = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
        const onVote = vi.fn();

        render(
            <VoteOptions
                question={{
                    _id: "q1",
                    groupId: "g1",
                    questionType: QuestionType.CustomSelectOne,
                    options: ["A", "B"],
                }}
                onVote={onVote}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "A" }));
        fireEvent.click(screen.getByRole("button", { name: "Submit" }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        const init = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]?.[1] as RequestInit;
        expect(init.method).toBe("POST");
        expect(JSON.parse(String(init.body))).toEqual({ response: ["A"] });
        expect(onVote).toHaveBeenCalled();
    });

    it("submits a multi-select vote", async () => {
        const fetchMock = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
        const onVote = vi.fn();

        render(
            <VoteOptions
                question={{
                    _id: "q1",
                    groupId: "g1",
                    questionType: QuestionType.CustomSelectMultiple,
                    options: ["A", "B", "C"],
                }}
                onVote={onVote}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "A" }));
        fireEvent.click(screen.getByRole("button", { name: "C" }));
        fireEvent.click(screen.getByRole("button", { name: "Submit" }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        const init = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]?.[1] as RequestInit;
        expect(JSON.parse(String(init.body))).toEqual({ response: ["A", "C"] });
    });

    it("submits image vote by key (not URL)", async () => {
        const fetchMock = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

        const options: QuestionOptionDTO[] = [
            { key: "k1", url: "https://example.com/1.png" },
            { key: "k2", url: "https://example.com/2.png" },
        ];

        render(
            <VoteOptions
                question={{
                    _id: "q1",
                    groupId: "g1",
                    questionType: QuestionType.ImageSelectOne,
                    options,
                }}
                onVote={() => {}}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Option 1" }));
        fireEvent.click(screen.getByRole("button", { name: "Submit" }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        const init = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]?.[1] as RequestInit;
        expect(JSON.parse(String(init.body))).toEqual({ response: ["k1"] });
    });

    it("submits text vote", async () => {
        const fetchMock = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

        render(
            <VoteOptions
                question={{
                    _id: "q1",
                    groupId: "g1",
                    questionType: QuestionType.Text,
                }}
                onVote={() => {}}
            />
        );

        fireEvent.change(screen.getByPlaceholderText("Enter your response"), {
            target: { value: "Hello" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Submit" }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        const init = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]?.[1] as RequestInit;
        expect(JSON.parse(String(init.body))).toEqual({ response: ["Hello"] });
    });
});
