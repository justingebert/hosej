import { IGroupJson } from "@/types/models/group";

export interface getGroupResponse{
    group: IGroupJson;
    userIsAdmin: boolean;
}

export interface updateGroupRequest{
    //TODO
}

export interface updateGroupResponse extends IGroupJson{}
