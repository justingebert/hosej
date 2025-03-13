import { IGroupJson } from "@/types/models/group";

export interface createGroupRequest {
    name: string;
}

export interface createGroupResponse {
    newGroup: IGroupJson;
}

export interface getGroupsResponse {
    groups: IGroupJson[];
}

