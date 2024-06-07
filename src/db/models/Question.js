"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var QuestionType;
(function (QuestionType) {
    QuestionType["UsersSelectOne"] = "users-select-one";
    QuestionType["UsersSelectMultiple"] = "users-select-multiple";
    QuestionType["CustomSelectOne"] = "custom-select-one";
    QuestionType["CustomSelectMultiple"] = "custom-select-multiple";
    QuestionType["Text"] = "text";
    QuestionType["Rating"] = "rating";
    QuestionType["MatchPairs"] = "match-pairs";
    QuestionType["Sequence"] = "sequence";
})(QuestionType || (QuestionType = {}));
var questionSchema = new mongoose_1.default.Schema({
    category: { type: String },
    questionType: {
        type: String,
        required: true,
        enum: Object.values(QuestionType),
    },
    question: { type: String, required: true },
    options: { type: mongoose_1.default.Schema.Types.Mixed, required: false },
    answers: [
        {
            username: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "user", required: true },
            response: { type: mongoose_1.default.Schema.Types.Mixed, required: true },
        },
    ],
    createdAt: { type: Date, default: Date.now },
    used: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
});
var Question = mongoose_1.default.models.Question || mongoose_1.default.model("Question", questionSchema);
exports.default = Question;
