export type createRallyData = {
    task: string;
    lengthInDays: number;
};

export type createQuestionData = {
    question: string;
    questionType: string;
    options: string[];
    mainImageFile: File | null;
    optionFiles: (File | null)[];
};
