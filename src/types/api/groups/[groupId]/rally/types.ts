import { IRallyJson } from "@/types/models";

export interface RallyWithUserState extends IRallyJson {
    userHasVoted: boolean;
    userHasUploaded: boolean;
}

export type getRalliesResponse = RallyWithUserState[];

export interface createRallyRequest {
    task: string;
    lengthInDays: number;
}