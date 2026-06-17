import crypto from "crypto";

const DEVICE_ID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeDeviceId(deviceId: string): string {
    return deviceId.trim().toLowerCase();
}

export function isValidDeviceId(deviceId: string | undefined): boolean {
    return !!deviceId && DEVICE_ID_REGEX.test(normalizeDeviceId(deviceId));
}

export function hashDeviceId(deviceId: string): string {
    return crypto.createHash("sha256").update(normalizeDeviceId(deviceId)).digest("hex");
}
