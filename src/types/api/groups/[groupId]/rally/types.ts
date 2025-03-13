import { IRallyJson } from "@/types/models";

export interface getRallieRepsonse {
    rallies: IRallyJson[];
}

export interface createRallyRequest {
    task: string;
    lengthInDays: number;
}