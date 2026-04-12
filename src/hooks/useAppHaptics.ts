"use client";

import { useCallback } from "react";
import type { HapticInput, TriggerOptions } from "web-haptics";
import { useWebHaptics } from "web-haptics/react";
import { defaultPatterns } from "web-haptics";

export type AppHapticType =
    | "none"
    | "tap"
    | "selection"
    | "navigation"
    | "success"
    | "warning"
    | "error"
    | "heavy"
    | "nudge"
    | "buzz";

const APP_HAPTIC_PATTERNS: Record<Exclude<AppHapticType, "none">, HapticInput> = {
    tap: [{ duration: 18, intensity: 0.45 }],
    selection: [{ duration: 10, intensity: 0.35 }],
    navigation: [
        { duration: 20, intensity: 0.6 },
        { delay: 24, duration: 12, intensity: 0.35 },
    ],
    success: "success",
    warning: "warning",
    error: "error",
    heavy: [{ duration: 38, intensity: 1 }],
    nudge: [
        { duration: 80, intensity: 0.8 },
        { delay: 80, duration: 50, intensity: 0.3 },
    ],
    buzz: defaultPatterns.buzz,
};

//TODO remove this, unssesary abstraction
export const useAppHaptics = () => {
    const { trigger, cancel, isSupported } = useWebHaptics();

    const play = useCallback(
        (type: AppHapticType = "tap") => {
            if (type === "none") return;
            void trigger(APP_HAPTIC_PATTERNS[type]);
        },
        [trigger]
    );

    const triggerCustom = useCallback(
        (input?: HapticInput, options?: TriggerOptions) => {
            void trigger(input, options);
        },
        [trigger]
    );

    return {
        play,
        trigger: triggerCustom,
        cancel,
        isSupported,
    };
};
