"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var pictureSubmissionSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    votes: { type: Number, default: 0 },
});
var rallySchema = new mongoose_1.default.Schema({
    task: { type: String, required: true },
    submissions: [pictureSubmissionSchema],
    startTime: { type: Date, default: Date.now, required: true },
    endTime: { type: Date, required: true },
    resultsShown: { type: Boolean, default: false },
    used: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
});
var Rally = mongoose_1.default.models.Rally || mongoose_1.default.model("Rally", rallySchema);
exports.default = Rally;
