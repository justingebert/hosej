import { IGroupJson } from "@/types/models/group";

export interface QuestionTypeCount {
  _id: string; 
  count: number;
}

export interface UserQuestionCount {
  username: string;
  count: number;
}

export interface getStatisticsResponse {
  group: IGroupJson;
  
  questionCount: number;
  questionsUsedCount: number;
  questionsLeftCount: number;
  questionsByType: QuestionTypeCount[];
  questionsByUser: UserQuestionCount[];
  
  rallyCount: number;
  ralliesUsedCount: number;
  ralliesLeftCount: number;
  
  messagesCount: number;
}