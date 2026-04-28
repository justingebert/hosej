import type { NotificationLanguage, NotificationStyle } from "@/types/models/user";

export enum NotificationEvent {
    QuestionNew = "question_new",
    QuestionEmpty = "question_empty",
    JukeboxNew = "jukebox_new",
    RallyStarted = "rally_started",
    RallyVoting = "rally_voting",
    RallyResults = "rally_results",
    QuestionUnanswered = "question_unanswered",
    RallySubmitDeadline = "rally_submit_deadline",
    RallyVoteDeadline = "rally_vote_deadline",
    RallyFirstSubmission = "rally_first_submission",
    JukeboxSubmit = "jukebox_submit",
    JukeboxRate = "jukebox_rate",
}

export type NotificationContext = {
    groupName?: string;
    monthName?: string;
    nextStart?: string;
    rallyTask?: string;
    hoursLeft?: string | number;
    jukeboxTitle?: string;
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
    [NotificationEvent.QuestionEmpty]: {
        en: {
            default: {
                title: "The question jar is empty 🫙",
                body: "{groupName} has nothing to vote on. Create new votings to keep the group alive.",
            },
            chaos: {
                title: "🥗 No questions left 🥗",
                body: "{groupName} is running on fumes. Add some questions or the group dies 💀",
            },
        },
        de: {
            default: {
                title: "Es hat sich ausgefragt 🫙",
                body: "{groupName} hat nichts zum Abstimmen. Erstelle neue Fragen und halte die Gruppe am Leben.",
            },
            chaos: {
                title: "🥗 Keine Fragen mehr 🥗",
                body: "{groupName} läuft leer. Füge Fragen hinzu oder die Gruppe stirbt 💀",
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
    [NotificationEvent.QuestionUnanswered]: {
        en: {
            default: {
                title: "You haven't answered today's questions ❓",
                body: "{groupName} is waiting. Only takes a minute.",
            },
            chaos: {
                title: "❓ {groupName} is waiting for you ❓",
                body: "Everyone else answered. You're the holdout 🫵",
            },
        },
        de: {
            default: {
                title: "Du hast heutige Fragen noch nicht beantwortet ❓",
                body: "{groupName} wartet. Dauert nur eine Minute.",
            },
            chaos: {
                title: "❓ {groupName} wartet auf dich ❓",
                body: "Alle anderen haben geantwortet. Du bist der Einzige 🫵",
            },
        },
    },
    [NotificationEvent.RallySubmitDeadline]: {
        en: {
            default: {
                title: "⏰ Rally ends in {hoursLeft}h",
                body: "{rallyTask} — get your shot in before time runs out.",
            },
            chaos: {
                title: "⏰ {hoursLeft}h left ⏰",
                body: "{rallyTask} — submit now or cry 😭",
            },
        },
        de: {
            default: {
                title: "⏰ Rally endet in {hoursLeft}h",
                body: "{rallyTask} — reich dein Foto ein bevor die Zeit abläuft.",
            },
            chaos: {
                title: "⏰ Noch {hoursLeft}h ⏰",
                body: "{rallyTask} — jetzt einreichen oder heulen 😭",
            },
        },
    },
    [NotificationEvent.RallyVoteDeadline]: {
        en: {
            default: {
                title: "Voting closes in {hoursLeft}h 🗳️",
                body: "Your vote still counts. Don't skip it.",
            },
            chaos: {
                title: "🗳️ {hoursLeft}h to vote or forever hold your peace 🗳️",
                body: "Your vote could be the difference. No pressure 😇",
            },
        },
        de: {
            default: {
                title: "Abstimmung endet in {hoursLeft}h 🗳️",
                body: "Deine Stimme zählt. Nicht verpassen.",
            },
            chaos: {
                title: "🗳️ Noch {hoursLeft}h zum Voten oder für immer schweigen 🗳️",
                body: "Deine Stimme könnte den Unterschied machen. No pressure 😇",
            },
        },
    },
    [NotificationEvent.RallyFirstSubmission]: {
        en: {
            default: {
                title: "First photo is in 📸",
                body: "{rallyTask} — someone set the bar. Your turn.",
            },
            chaos: {
                title: "📸 First shot landed and it's good 📸",
                body: "{rallyTask} — are you really gonna let them win unopposed 🏆",
            },
        },
        de: {
            default: {
                title: "Erstes Foto ist drin 📸",
                body: "{rallyTask} — jemand hat die Messlatte gesetzt. Jetzt du.",
            },
            chaos: {
                title: "📸 Erstes Foto ist da und es ist gut 📸",
                body: "{rallyTask} — lässt du die wirklich unangefochten gewinnen 🏆",
            },
        },
    },
    [NotificationEvent.JukeboxSubmit]: {
        en: {
            default: {
                title: "{jukeboxTitle} needs a song 🎧",
                body: "You haven't added one yet — drop a track.",
            },
            chaos: {
                title: "🎧 Where's your song 🎧",
                body: "{jukeboxTitle} — add a track and farm some aura 💥",
            },
        },
        de: {
            default: {
                title: "{jukeboxTitle} braucht einen Song 🎧",
                body: "Du hast noch keinen hinzugefügt — pack einen rein.",
            },
            chaos: {
                title: "🎧 Wo ist dein Song 🎧",
                body: "{jukeboxTitle} — pack einen Track rein und farm etwas Aura 💥",
            },
        },
    },
    [NotificationEvent.JukeboxRate]: {
        en: {
            default: {
                title: "{jukeboxTitle} — songs need ratings ⭐",
                body: "A few tracks are sitting unrated. Take a listen.",
            },
            chaos: {
                title: "⭐ Rate the songs or your opinion doesn't count ⭐",
                body: "{jukeboxTitle} — others are farming votes, this must be stopped 🎵",
            },
        },
        de: {
            default: {
                title: "{jukeboxTitle} — Songs warten auf Bewertungen ⭐",
                body: "Ein paar Tracks sind noch unbewertet. Hör mal rein.",
            },
            chaos: {
                title: "⭐ Bewerte die Songs oder deine Meinung zählt nicht ⭐",
                body: "{jukeboxTitle} — andere farmen Votes, das muss gestoppt werden 🎵",
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
