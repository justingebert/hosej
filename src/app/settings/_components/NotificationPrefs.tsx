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
    type NotificationPrefKey,
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

type PrefRow = {
    key: NotificationPrefKey;
    label: string;
    description: string;
};

const PREF_ROWS: PrefRow[] = [
    {
        key: "questionUnanswered",
        label: "Unanswered questions",
        description: "Nudge when today's questions are still open.",
    },
    {
        key: "rallySubmitDeadline",
        label: "Rally deadline",
        description: "Heads up 24h before a rally's submission closes.",
    },
    {
        key: "rallyVoteDeadline",
        label: "Rally voting deadline",
        description: "Heads up 24h before rally voting closes.",
    },
    {
        key: "rallyFirstSubmission",
        label: "First rally submission",
        description: "Ping when someone submits to a rally you haven't joined.",
    },
    {
        key: "jukeboxSubmit",
        label: "Jukebox song nudge",
        description: "Remind you to add a track if you haven't yet.",
    },
    {
        key: "jukeboxRate",
        label: "Jukebox rating nudge",
        description: "Remind you to rate the submitted songs.",
    },
];

export function NotificationPrefs() {
    const { toast } = useToast();
    const { data, mutate, isLoading } = useSWR<UserDTO>("/api/users", fetcher);

    const language = data?.notificationLanguage ?? DEFAULT_NOTIFICATION_LANGUAGE;
    const style = data?.notificationStyle ?? DEFAULT_NOTIFICATION_STYLE;
    const prefs: NotificationPrefs = {
        ...DEFAULT_NOTIFICATION_PREFS,
        ...(data?.notificationPrefs ?? {}),
    };

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

            {/*<div className="space-y-3">*/}
            {/*    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">*/}
            {/*        Participation reminders*/}
            {/*    </div>*/}
            {/*    {PREF_ROWS.map((row) => (*/}
            {/*        <div key={row.key} className="flex items-center justify-between gap-3">*/}
            {/*            <div className="space-y-0.5 flex-1 min-w-0">*/}
            {/*                <div className="font-medium text-sm">{row.label}</div>*/}
            {/*                <div className="text-sm text-muted-foreground line-clamp-2">*/}
            {/*                    {row.description}*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*            <Switch*/}
            {/*                checked={prefs[row.key]}*/}
            {/*                onCheckedChange={(checked) => togglePref(row.key, checked)}*/}
            {/*            />*/}
            {/*        </div>*/}
            {/*    ))}*/}
            {/*</div>*/}
        </div>
    );
}
