export type ConsentStatus = "unknown" | "granted" | "denied";

export const CONSENT_KEY = "hosej_consent";

export function getStoredConsent(): ConsentStatus {
    if (typeof window === "undefined") return "unknown";
    const v = window.localStorage.getItem(CONSENT_KEY);
    if (v === "granted" || v === "denied") return v;
    return "unknown";
}

export function setStoredConsent(status: Exclude<ConsentStatus, "unknown">) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CONSENT_KEY, status);
}

export function clearStoredConsent() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CONSENT_KEY);
}
