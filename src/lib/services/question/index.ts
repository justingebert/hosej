export {
    createQuestion,
    createQuestionFromTemplate,
    getActiveQuestions,
    getQuestionById,
    voteOnQuestion,
    rateQuestion,
    getQuestionResults,
    attachImage,
    attachOptions,
    activateSmartQuestions,
    deactivateCurrentQuestions,
    parseVoteResponse,
} from "./question";

export {
    createTemplatesFromArray,
    addTemplatePackToGroup,
    validateTemplates,
    formatValidationErrors,
} from "./template";

export type { TemplateInput, ValidationResult } from "./validateTemplateQuestions";
