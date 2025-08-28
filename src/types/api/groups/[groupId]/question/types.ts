import { IQuestionJson, QuestionRating } from "@/types/models";

export interface questionWithUserState extends IQuestionJson{
    userHasVoted: boolean;
    userRating: QuestionRating
}

export interface getQuestionsResponse {
    questions: questionWithUserState[];
    completionPercentage: number;
}

export interface createQuestionResponse extends IQuestionJson{}