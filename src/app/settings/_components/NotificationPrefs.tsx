"use client";

import useSWR from "swr";
import { useToast } from "@/hooks/use-toast";
import fetcher from "@/lib/fetcher";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
// import { Switch } from "@/components/ui/switch";
import {
    DEFAULT_NOTIFICATION_LANGUAGE,
    DEFAULT_NOTIFICATION_PREFS,
    DEFAULT_NOTIFICATION_STYLE,
    type NotificationLanguage,
    type NotificationPrefs,
    type NotificationStyle,
    type UserDTO,
} from "@/types/models/user";

const LANGUAGE_LABELS: Record<NotificationLanguage, string> = {
    en: "English",
    de: "Deutsch",
};

const STYLE_LABELS: Record<NotificationStyle, string> = {
    default: "Default",
    chaos: "Chaos",
};

export function NotificationPrefs() {
    const { toast } = useToast();
    const { data, mutate, isLoading } = useSWR<UserDTO>("/api/users", fetcher);

    const language = data?.notificationLanguage ?? DEFAULT_NOTIFICATION_LANGUAGE;
    const style = data?.notificationStyle ?? DEFAULT_NOTIFICATION_STYLE;
    type UpdatePatch = {
        notificationLanguage?: NotificationLanguage;
        notificationStyle?: NotificationStyle;
        notificationPrefs?: Partial<NotificationPrefs>;
    };
    const updatePref = async (patch: UpdatePatch, optimisticOverride?: UserDTO) => {
        const previous = data;
        let optimistic = optimisticOverride;
        if (!optimistic && previous) {
            optimistic = {
                ...previous,
                ...(patch.notificationLanguage !== undefined && {
                    notificationLanguage: patch.notificationLanguage,
                }),
                ...(patch.notificationStyle !== undefined && {
                    notificationStyle: patch.notificationStyle,
                }),
            };
        }
        mutate(optimistic, false);
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error("Failed to update preferences");
            await mutate();
        } catch (err) {
            mutate(previous, false);
            const message = err instanceof Error ? err.message : "Something went wrong";
            toast({
                title: "Preferences not saved",
                description: message,
                variant: "destructive",
            });
        }
    };

    // const togglePref = (key: NotificationPrefKey, value: boolean) => {
    //     const nextPrefs: NotificationPrefs = { ...prefs, [key]: value };
    //     const optimistic = data ? { ...data, notificationPrefs: nextPrefs } : undefined;
    //     const patch: Partial<NotificationPrefs> = { [key]: value };
    //     updatePref({ notificationPrefs: patch }, optimistic);
    // };

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                        <div className="font-medium text-sm">Notification Language</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                            Language of push notifications.
                        </div>
                    </div>
                    <Select
                        value={language}
                        onValueChange={(value) =>
                            updatePref({ notificationLanguage: value as NotificationLanguage })
                        }
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {(Object.keys(LANGUAGE_LABELS) as NotificationLanguage[]).map(
                                (lang) => (
                                    <SelectItem key={lang} value={lang}>
                                        {LANGUAGE_LABELS[lang]}
                                    </SelectItem>
                                )
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                        <div className="font-medium text-sm">Notification Style</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                            Tone of push notifications.
                        </div>
                    </div>
                    <Select
                        value={style}
                        onValueChange={(value) =>
                            updatePref({ notificationStyle: value as NotificationStyle })
                        }
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {(Object.keys(STYLE_LABELS) as NotificationStyle[]).map((s) => (
                                <SelectItem key={s} value={s}>
                                    {STYLE_LABELS[s]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
