import { IGroupJson } from "@/types/models/group";

export interface QuestionTypeCount {
  _id: string;  // Question type
  count: number;
}

export interface UserQuestionCount {
  username: string;
  count: number;
}

export interface IGroupStatsResponse {
  group: IGroupJson;
  
  questionsUsedCount: number;
  questionsLeftCount: number;
  questionsByType: QuestionTypeCount[];
  questionsByUser: UserQuestionCount[];
  
  RalliesUsedCount: number;
  RalliesLeftCount: number;
  
  messagesCount: number;
}