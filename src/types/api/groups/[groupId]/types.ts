import { IGroupJson } from "@/types/models/group";

export interface IGroupResponse extends IGroupJson {
    userIsAdmin: boolean;
}