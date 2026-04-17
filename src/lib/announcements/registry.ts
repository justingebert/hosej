export type AnnouncementCTA = {
    label: string;
    href: string;
};

type FeedbackInputBase = {
    id: string;
    prompt: string;
    optional?: boolean;
};

export type ChoiceInput = FeedbackInputBase & {
    kind: "choice";
    options: { value: string; label: string }[];
};
export type ThumbsInput = FeedbackInputBase & { kind: "thumbs" };
export type StarsInput = FeedbackInputBase & { kind: "stars" };
export type TextInput = FeedbackInputBase & {
    kind: "text";
    placeholder?: string;
    maxLength?: number;
};
export type FeedbackInput = ChoiceInput | ThumbsInput | StarsInput | TextInput;

type Base = {
    id: string;
    title: string;
    body: string;
    publishedAt: string;
};

export type InfoAnnouncement = Base & { kind: "info" };
export type CtaAnnouncement = Base & { kind: "cta"; cta: AnnouncementCTA };
export type FeedbackAnnouncement = Base & {
    kind: "feedback";
    inputs: FeedbackInput[];
};

export type StaticAnnouncement = InfoAnnouncement | CtaAnnouncement | FeedbackAnnouncement;

export const STATIC_ANNOUNCEMENTS: StaticAnnouncement[] = [
    {
        id: "feedback-1",
        title: "Moin! Und ihr so? ",
        body:
            "Wenn ihr das hier seht funktioniert das neue Feature :). " +
            "Ach ja und ich würde gerne wissen wie euch die App gefällt und ob Ihr Feedback oder Feature Wünsche habt.",
        publishedAt: "2026-04-18T00:00:00.000Z",
        kind: "feedback",
        inputs: [
            {
                id: "rating",
                kind: "stars",
                prompt: "Wie gefällt dir die App / Das Konzept?",
            },
            {
                id: "feedback",
                kind: "text",
                prompt: "Feedback oder Feature Wünsche (wenn nicht dann einfach X rein)",
                maxLength: 5000,
            },
            {
                id: "new-users?",
                kind: "choice",
                prompt: "Hättest du Interesse und weitere Gruppen Freunden zu erstellen und die App gemeinsam zu testen? Das würde mir sehr helfen, die Test-User-Base zu erweitern 🙌",
                options: [
                    { value: "yes", label: "Ja Lets Go" },
                    { value: "no", label: "Ne bro..." },
                    { value: "fuck u", label: "Hab keine Freunde :(" },
                ],
            },
        ],
    },
];
