import type { Types } from "mongoose";

export type PushCall = {
    title: string;
    body: string;
    groupId: string | Types.ObjectId;
};

const calls: PushCall[] = [];

export async function sendNotification(
    title: string,
    body: string,
    groupId: string | Types.ObjectId = ""
) {
    calls.push({ title, body, groupId });
    return { success: true, successCount: 1, failureCount: 0 };
}

export function getPushCalls(): ReadonlyArray<PushCall> {
    return calls;
}

export function resetPushFake() {
    calls.length = 0;
}
