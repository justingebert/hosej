import { describe, it, expect } from "vitest";
import { parseQuestionVoteResponse } from "./parseQuestionVoteResponse";

describe("parseQuestionVoteResponse", () => {
    it("accepts a string", () => {
        expect(parseQuestionVoteResponse("hello")).toEqual(["hello"]);
    });

    it("accepts an array of strings", () => {
        expect(parseQuestionVoteResponse(["a", "b"])).toEqual(["a", "b"]);
    });

    it("trims values and drops empty strings", () => {
        expect(parseQuestionVoteResponse(["  a  ", " ", "\n", "b"])).toEqual(["a", "b"]);
    });

    it("throws when response is not a string or string[]", () => {
        expect(() => parseQuestionVoteResponse({})).toThrow(
            "response must be a string or an array of strings"
        );
        expect(() => parseQuestionVoteResponse([1 as unknown as string])).toThrow(
            "response must be a string or an array of strings"
        );
    });

    it("throws when response is empty", () => {
        expect(() => parseQuestionVoteResponse([])).toThrow("response is required");
        expect(() => parseQuestionVoteResponse(["  "])).toThrow("response is required");
    });
});
