"use client";

import { Button } from "@/components/ui/button";
import { useConsent } from "@/components/wrappers/ConsentProvider";

export default function CookiePreferences() {
    const { status, grant, deny } = useConsent();

    return (
        <div className="rounded-lg border bg-card p-3 space-y-2">
            <p className="text-xs text-muted-foreground">
                Current choice:{" "}
                <strong className="text-foreground">
                    {status === "granted"
                        ? "Analytics enabled"
                        : status === "denied"
                          ? "Analytics disabled"
                          : "Not set"}
                </strong>
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={deny}
                    disabled={status === "denied"}
                >
                    Disable
                </Button>
                <Button
                    size="sm"
                    className="flex-1"
                    onClick={grant}
                    disabled={status === "granted"}
                >
                    Enable
                </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
                Disabling stops PostHog analytics and Sentry session replay. Reload the page to
                fully unload them.
            </p>
        </div>
    );
}
