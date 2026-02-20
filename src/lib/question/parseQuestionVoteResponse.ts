export function parseQuestionVoteResponse(response: unknown): string[] {
    const rawResponses =
        typeof response === "string"
            ? [response]
            : Array.isArray(response) && response.every((r) => typeof r === "string")
              ? response
              : null;

    if (!rawResponses) {
        throw new Error("response must be a string or an array of strings");
    }

    const normalized = rawResponses.map((r) => r.trim()).filter((r) => r.length > 0);
    if (normalized.length === 0) {
        throw new Error("response is required");
    }

    return normalized;
}
