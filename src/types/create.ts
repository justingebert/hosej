export type createRallyData = {
    task: string;
    lengthInDays: number;
};

export type createQuestionData = {
    question: string;
    questionType: string;
    multiSelect: boolean;
    options: string[];
    mainImageFile: File | null;
    optionFiles: (File | null)[];
    pairingKeySource?: string;
    pairingMode?: string;
    pairingKeys?: string[];
    pairingValues?: string[];
};
