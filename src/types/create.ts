export type createRallyData = {
    task: string;
    lengthInDays: number;
};

import type { PairingKeySource, PairingMode } from "@/types/models/question";

export type createQuestionData = {
    question: string;
    questionType: string;
    multiSelect: boolean;
    options: string[];
    mainImageFile: File | null;
    optionFiles: (File | null)[];
    pairing?: {
        keySource: PairingKeySource;
        mode: PairingMode;
        keys?: string[];
        values: string[];
    };
};
