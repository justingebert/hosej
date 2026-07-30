import type { NotificationLanguage, NotificationStyle } from "@/types/models/user";

// Event notifications only — "the group did something". Reminder/nag events
// (unanswered questions, submission and voting deadlines, rate-the-songs) were
// deliberately removed along with the reminders service; chat pings don't live
// here because they send a ready-made title/body rather than a template.
export enum NotificationEvent {
    QuestionNew = "question_new",
    JukeboxNew = "jukebox_new",
    RallyStarted = "rally_started",
    RallyVoting = "rally_voting",
    RallyResults = "rally_results",
}

export type NotificationContext = {
    groupName?: string;
    monthName?: string;
};

type Copy = { title: string; body: string };
type StyleMap = Record<NotificationStyle, Copy>;
type LangMap = Record<NotificationLanguage, StyleMap>;

const TEMPLATES: Record<NotificationEvent, LangMap> = {
    [NotificationEvent.QuestionNew]: {
        en: {
            default: {
                title: "{groupName} dropped new questions ✍️",
                body: "Today's votes are waiting. Don't be the last one.",
            },
            chaos: {
                title: "🚨 {groupName} questions are live 🚨",
                body: "Everyone else is already voting. What's your excuse?",
            },
        },
        de: {
            default: {
                title: "{groupName} hat neue Fragen ✍️",
                body: "Die Abstimmung läuft...",
            },
            chaos: {
                title: "🚨 {groupName} Fragen sind live 🚨",
                body: "Alle anderen voten schon. Was ist deine Ausrede??",
            },
        },
    },
    [NotificationEvent.JukeboxNew]: {
        en: {
            default: {
                title: "Jukebox 🎶",
                body: "Drop your tracks!",
            },
            chaos: {
                title: "🎶 Jukebox 🎶",
                body: "Submit your songs — let the votefarming begin 🎶",
            },
        },
        de: {
            default: {
                title: "Jukebox 🎶",
                body: "Teile deine Tracks!",
            },
            chaos: {
                title: "🎶 Jukebox 🎶",
                body: "Songs einreichen — lasset das Votefarming beginnen 🎶",
            },
        },
    },
    [NotificationEvent.RallyStarted]: {
        en: {
            default: {
                title: "New {groupName} Rally started! 📷",
                body: "The task is live. Get out there and take your shot.",
            },
            chaos: {
                title: "📷 New {groupName} Rally started! 📷",
                body: "People are already out there. What are you waiting for 🏃",
            },
        },
        de: {
            default: {
                title: "Neue {groupName} Rally 📷",
                body: "Aufgabe ist live. Raus und Momente sammeln.",
            },
            chaos: {
                title: "📷 {groupName} Rally ist live 📷",
                body: "Andere sind schon draußen. Worauf wartest du noch 🏃",
            },
        },
    },
    [NotificationEvent.RallyVoting]: {
        en: {
            default: {
                title: "{groupName} Rally — voting's open 🗳️",
                body: "Submissions are in. Go pick your favorite.",
            },
            chaos: {
                title: "🗳️ {groupName} voting is open 🗳️",
                body: "The photos are in and they're judging you for not voting yet 👀",
            },
        },
        de: {
            default: {
                title: "{groupName} Rally — Abstimmung läuft 🗳️",
                body: "Einsendungen sind drin. Geh und wähl dein Lieblingsfoto.",
            },
            chaos: {
                title: "🗳️ {groupName} Abstimmung ist offen 🗳️",
                body: "Die Fotos sind da und alle fragen sich warum du noch nicht gevoted hast 👀",
            },
        },
    },
    [NotificationEvent.RallyResults]: {
        en: {
            default: {
                title: "{groupName} Rally results are in 📷",
                body: "The winner has been crowned. Go see who took it.",
            },
            chaos: {
                title: "📷 {groupName} results are in 📷",
                body: "Someone won and it might not be who you think 👑",
            },
        },
        de: {
            default: {
                title: "{groupName} Rally Ergebnisse sind da 📷",
                body: "Der Gewinner steht fest.",
            },
            chaos: {
                title: "📷 {groupName} Ergebnisse sind da 📷",
                body: "Jemand hat gewonnen und es ist vielleicht nicht wer du denkst 👑",
            },
        },
    },
};

function interpolate(template: string, ctx: NotificationContext): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        const value = ctx[key as keyof NotificationContext];
        return value !== undefined && value !== null ? String(value) : match;
    });
}

export function renderNotification(
    event: NotificationEvent,
    language: NotificationLanguage,
    style: NotificationStyle,
    context: NotificationContext
): { title: string; body: string } {
    const copy = TEMPLATES[event][language][style];
    return {
        title: interpolate(copy.title, context),
        body: interpolate(copy.body, context),
    };
}
