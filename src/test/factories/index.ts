import { Types } from "mongoose";
import User from "@/db/models/User";
import Group from "@/db/models/Group";
import Question from "@/db/models/Question";
import Rally from "@/db/models/Rally";
import Jukebox from "@/db/models/Jukebox";
import Chat from "@/db/models/Chat";
import { QuestionType } from "@/types/models/question";
import { RallyStatus } from "@/types/models/rally";

let counter = 0;
const uniq = () => `${Date.now()}_${++counter}`;

export type UserOverrides = Partial<{
    username: string;
    deviceId: string;
    groups: Types.ObjectId[];
    googleId: string;
    googleConnected: boolean;
    fcmToken: string;
    onboardingCompleted: boolean;
    avatar: string;
    announcementsSeen: string[];
    createdAt: Date;
}>;

export async function makeUser(overrides: UserOverrides = {}) {
    const n = uniq();
    return User.create({
        username: overrides.username ?? `user_${n}`,
        deviceId: overrides.deviceId ?? `device_${n}`,
        groups: overrides.groups ?? [],
        ...overrides,
    });
}

export type GroupOverrides = Partial<{
    name: string;
    admin: Types.ObjectId;
    language: "de" | "en";
    members: Array<{
        user: Types.ObjectId;
        name?: string;
        points?: number;
        streak?: number;
        lastPointDate?: Date | null;
    }>;
    features: Record<string, unknown>;
}>;

export async function makeGroup(overrides: GroupOverrides = {}) {
    const admin = overrides.admin ?? (await makeUser())._id;
    const members = overrides.members ?? [{ user: admin, name: "admin" }];
    return Group.create({
        name: overrides.name ?? `group_${uniq()}`,
        admin,
        members,
        ...overrides,
    });
}

export type QuestionOverrides = Partial<{
    groupId: Types.ObjectId;
    question: string;
    questionType: QuestionType;
    options: unknown;
    active: boolean;
    used: boolean;
    submittedBy: Types.ObjectId;
    multiSelect: boolean;
    category: string;
}>;

export async function makeQuestion(overrides: QuestionOverrides = {}) {
    return Question.create({
        groupId: overrides.groupId ?? new Types.ObjectId(),
        question: overrides.question ?? `question_${uniq()}`,
        questionType: overrides.questionType ?? QuestionType.Custom,
        options: overrides.options ?? ["a", "b", "c"],
        ...overrides,
    });
}

export type RallyOverrides = Partial<{
    groupId: Types.ObjectId;
    task: string;
    status: RallyStatus;
    lengthInDays: number;
    createdBy: Types.ObjectId;
    startTime: Date | null;
}>;

export async function makeRally(overrides: RallyOverrides = {}) {
    return Rally.create({
        groupId: overrides.groupId ?? new Types.ObjectId(),
        task: overrides.task ?? `rally_${uniq()}`,
        status: overrides.status ?? RallyStatus.Created,
        lengthInDays: overrides.lengthInDays ?? 3,
        ...overrides,
    });
}

export type JukeboxOverrides = Partial<{
    groupId: Types.ObjectId;
    title: string;
    active: boolean;
    songs: unknown[];
}>;

export async function makeJukebox(overrides: JukeboxOverrides = {}) {
    return Jukebox.create({
        groupId: overrides.groupId ?? new Types.ObjectId(),
        title: overrides.title ?? `jukebox_${uniq()}`,
        ...overrides,
    });
}

export type ChatOverrides = Partial<{
    group: Types.ObjectId;
    entity: Types.ObjectId;
    entityModel: "Question" | "Rally" | "Jukebox";
    messages: Array<{ user: Types.ObjectId; message: string }>;
}>;

export async function makeChat(overrides: ChatOverrides = {}) {
    return Chat.create({
        group: overrides.group ?? new Types.ObjectId(),
        entity: overrides.entity ?? new Types.ObjectId(),
        entityModel: overrides.entityModel ?? "Question",
        messages: overrides.messages ?? [],
    });
}
