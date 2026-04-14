import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Types } from "mongoose";

vi.mock("@/db/dbConnect");
vi.mock("@/db/models/Rally");
vi.mock("@/db/models/Group");
vi.mock("@/db/models/User");
vi.mock("@/db/models/ActivityEvent");
vi.mock("@/lib/services/group");
vi.mock("@/lib/services/chat");
vi.mock("@/lib/sendNotification");
vi.mock("firebase-admin", () => ({
    default: { apps: [{}], initializeApp: vi.fn(), credential: { cert: vi.fn() } },
}));
vi.mock("@aws-sdk/client-s3");
vi.mock("@aws-sdk/s3-request-presigner", () => ({
    getSignedUrl: vi.fn().mockResolvedValue("https://signed-url.example.com/image.jpg"),
}));

import {
    getActiveRallies,
    processRallyStateTransitions,
    createRallyByUser,
    activateRallies,
    getSubmissions,
    addSubmission,
    voteOnSubmission,
} from "./rally";
import Rally from "@/db/models/Rally";
import Group from "@/db/models/Group";
import User from "@/db/models/User";
import { isUserInGroup, isUserAdmin, addPointsToMember } from "@/lib/services/group";
import { createChatForEntity } from "@/lib/services/chat";
import { sendNotification } from "@/lib/sendNotification";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { RallyStatus } from "@/types/models/rally";

// ─── Test IDs ──────────────────────────────────────────────────────────────

const mockUserId = new Types.ObjectId().toString();
const mockOtherUserId = new Types.ObjectId().toString();
const mockGroupId = new Types.ObjectId().toString();
const mockRallyId = new Types.ObjectId().toString();
const mockSubmissionId = new Types.ObjectId().toString();
const mockChatId = new Types.ObjectId();

// ─── Factories ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMockRally(overrides: Record<string, any> = {}) {
    return {
        _id: new Types.ObjectId(mockRallyId),
        groupId: new Types.ObjectId(mockGroupId),
        task: "Take a sunset photo",
        lengthInDays: 3,
        status: RallyStatus.Submission,
        submissions: [] as any[],
        startTime: new Date(Date.now() - 86400000),
        submissionEnd: new Date(Date.now() + 86400000),
        votingEnd: null,
        resultsEnd: null,
        createdBy: new Types.ObjectId(mockUserId),
        chat: mockChatId,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

function createMockGroup(overrides: Record<string, unknown> = {}) {
    return {
        _id: new Types.ObjectId(mockGroupId),
        name: "Test Group",
        members: [
            { user: new Types.ObjectId(mockUserId), name: "User1", points: 0, streak: 0 },
            { user: new Types.ObjectId(mockOtherUserId), name: "User2", points: 0, streak: 0 },
        ],
        features: {
            rallies: {
                enabled: true,
                settings: {
                    rallyCount: 1,
                    rallyGapDays: 14,
                },
            },
        },
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

function createMockUser(id: string = mockUserId, overrides: Record<string, unknown> = {}) {
    return {
        _id: new Types.ObjectId(id),
        username: "testuser",
        ...overrides,
    };
}

// ─── Setup ─────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
    (sendNotification as Mock).mockResolvedValue({ success: true });
    (isUserInGroup as Mock).mockResolvedValue(undefined);
    (isUserAdmin as Mock).mockResolvedValue(undefined);
    (addPointsToMember as Mock).mockResolvedValue(undefined);
});

// ─── getActiveRallies ─────────────────────────────────────────────────────

describe("getActiveRallies", () => {
    it("returns empty array when no active rallies exist", async () => {
        (Rally.find as Mock).mockResolvedValue([]);
        (Group.findById as Mock).mockResolvedValue(createMockGroup());

        const result = await getActiveRallies(mockUserId, mockGroupId);

        expect(result.rallies).toEqual([]);
        expect(result.message).toBe("No active rallies");
    });

    it("returns rallies in submission/voting/results status", async () => {
        const rally = createMockRally();
        (Rally.find as Mock).mockResolvedValue([rally]);
        (Group.findById as Mock).mockResolvedValue(createMockGroup());

        const result = await getActiveRallies(mockUserId, mockGroupId);

        expect(result.rallies).toHaveLength(1);
        expect(result.rallies[0]).toBe(rally);
        expect(Rally.find).toHaveBeenCalledWith({
            groupId: mockGroupId,
            status: { $in: [RallyStatus.Submission, RallyStatus.Voting, RallyStatus.Results] },
        });
    });

    it("does not mutate rally state", async () => {
        const rally = createMockRally();
        (Rally.find as Mock).mockResolvedValue([rally]);
        (Group.findById as Mock).mockResolvedValue(createMockGroup());

        await getActiveRallies(mockUserId, mockGroupId);

        expect(rally.save).not.toHaveBeenCalled();
        expect(sendNotification).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when group doesn't exist", async () => {
        (Group.findById as Mock).mockResolvedValue(null);

        await expect(getActiveRallies(mockUserId, mockGroupId)).rejects.toThrow(NotFoundError);
    });
});

// ─── processRallyStateTransitions ─────────────────────────────────────────

describe("processRallyStateTransitions", () => {
    it("silently returns when group not found", async () => {
        (Group.findById as Mock).mockResolvedValue(null);

        await expect(processRallyStateTransitions(mockGroupId)).resolves.toBeUndefined();
        expect(Rally.find).not.toHaveBeenCalled();
    });

    it("silently returns when no processable rallies", async () => {
        (Group.findById as Mock).mockResolvedValue(createMockGroup());
        (Rally.find as Mock).mockResolvedValue([]);

        await expect(processRallyStateTransitions(mockGroupId)).resolves.toBeUndefined();
        expect(sendNotification).not.toHaveBeenCalled();
    });

    it("transitions scheduled → submission when start time arrives", async () => {
        const rally = createMockRally({
            status: RallyStatus.Scheduled,
            startTime: new Date(Date.now() - 1000),
            submissionEnd: new Date(Date.now() + 86400000),
        });
        (Rally.find as Mock).mockResolvedValue([rally]);
        (Group.findById as Mock).mockResolvedValue(createMockGroup());

        await processRallyStateTransitions(mockGroupId);

        expect(rally.status).toBe(RallyStatus.Submission);
        expect(rally.save).toHaveBeenCalled();
        expect(sendNotification).toHaveBeenCalledWith(
            expect.stringContaining("Rally Started"),
            expect.any(String),
            mockGroupId
        );
    });

    it("does not transition scheduled rally before start time", async () => {
        const rally = createMockRally({
            status: RallyStatus.Scheduled,
            startTime: new Date(Date.now() + 86400000), // tomorrow
            submissionEnd: new Date(Date.now() + 2 * 86400000),
        });
        (Rally.find as Mock).mockResolvedValue([rally]);
        (Group.findById as Mock).mockResolvedValue(createMockGroup());

        await processRallyStateTransitions(mockGroupId);

        expect(rally.status).toBe(RallyStatus.Scheduled);
        expect(rally.save).not.toHaveBeenCalled();
    });

    it("transitions submission → voting when submissionEnd passes", async () => {
        const rally = createMockRally({
            status: RallyStatus.Submission,
            submissionEnd: new Date(Date.now() - 1000),
        });
        (Rally.find as Mock).mockResolvedValue([rally]);
        (Group.findById as Mock).mockResolvedValue(createMockGroup());

        await processRallyStateTransitions(mockGroupId);

        expect(rally.status).toBe(RallyStatus.Voting);
        expect(rally.votingEnd).toBeInstanceOf(Date);
        expect(rally.save).toHaveBeenCalled();
        expect(sendNotification).toHaveBeenCalledWith(
            expect.stringContaining("Voting"),
            expect.any(String),
            mockGroupId
        );
    });

    it("transitions voting → results when votingEnd passes", async () => {
        const rally = createMockRally({
            status: RallyStatus.Voting,
            votingEnd: new Date(Date.now() - 1000),
        });
        (Rally.find as Mock).mockResolvedValue([rally]);
        (Group.findById as Mock).mockResolvedValue(createMockGroup());

        await processRallyStateTransitions(mockGroupId);

        expect(rally.status).toBe(RallyStatus.Results);
        expect(rally.resultsEnd).toBeInstanceOf(Date);
        expect(rally.save).toHaveBeenCalled();
        expect(sendNotification).toHaveBeenCalledWith(
            expect.stringContaining("Results"),
            expect.any(String),
            mockGroupId
        );
    });

    it("transitions results → completed and activates next rally", async () => {
        const rally = createMockRally({
            status: RallyStatus.Results,
            resultsEnd: new Date(Date.now() - 1000),
        });
        const nextRally = createMockRally({
            _id: new Types.ObjectId(),
            status: RallyStatus.Created,
            startTime: null,
            submissionEnd: null,
        });
        (Rally.find as Mock).mockResolvedValue([rally]);
        (Rally.findOne as Mock).mockResolvedValue(nextRally);
        (Group.findById as Mock).mockResolvedValue(createMockGroup());

        await processRallyStateTransitions(mockGroupId);

        expect(rally.status).toBe(RallyStatus.Completed);
        expect(nextRally.status).toBe(RallyStatus.Scheduled);
        expect(nextRally.startTime).toBeInstanceOf(Date);
        expect(nextRally.submissionEnd).toBeInstanceOf(Date);
        expect(nextRally.save).toHaveBeenCalled();
    });
});

// ─── createRally ───────────────────────────────────────────────────────────

describe("createRally", () => {
    it("creates a rally with chat and awards points", async () => {
        const mockGroup = createMockGroup();
        const mockUser = createMockUser();
        const mockChat = { _id: mockChatId };

        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (User.findById as Mock).mockResolvedValue(mockUser);
        (createChatForEntity as Mock).mockResolvedValue(mockChat);

        const mockRallyInstance = createMockRally();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(Rally).mockImplementation(function (this: any, data: any) {
            Object.assign(this, mockRallyInstance, data);
            this.save = mockRallyInstance.save;
            return this;
        } as any);

        await createRallyByUser(mockUserId, mockGroupId, {
            task: "Take a photo",
            lengthInDays: 3,
        });

        expect(mockRallyInstance.save).toHaveBeenCalled();
        expect(createChatForEntity).toHaveBeenCalled();
        expect(addPointsToMember).toHaveBeenCalledWith(mockGroup, mockUserId, 3);
    });

    it("throws ValidationError when task is missing", async () => {
        await expect(
            createRallyByUser(mockUserId, mockGroupId, { task: "", lengthInDays: 3 })
        ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when lengthInDays is missing", async () => {
        await expect(
            createRallyByUser(mockUserId, mockGroupId, {
                task: "Test",
                lengthInDays: 0,
            })
        ).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when group not found", async () => {
        (Group.findById as Mock).mockResolvedValue(null);
        (User.findById as Mock).mockResolvedValue(createMockUser());

        await expect(
            createRallyByUser(mockUserId, mockGroupId, {
                task: "Test",
                lengthInDays: 3,
            })
        ).rejects.toThrow(NotFoundError);
    });
});

// ─── activateRallies ───────────────────────────────────────────────────────

describe("activateRallies", () => {
    it("activates pending rallies up to the configured count", async () => {
        const mockGroup = createMockGroup();
        const pendingRally = createMockRally({ status: RallyStatus.Created });

        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (Rally.find as Mock)
            .mockResolvedValueOnce([]) // no active rallies
            .mockReturnValue({
                limit: vi.fn().mockResolvedValue([pendingRally]),
            });

        const result = await activateRallies(mockUserId, mockGroupId);

        expect(pendingRally.status).toBe(RallyStatus.Submission);
        expect(pendingRally.startTime).toBeInstanceOf(Date);
        expect(pendingRally.submissionEnd).toBeInstanceOf(Date);
        expect(pendingRally.save).toHaveBeenCalled();
    });

    it("returns already active rallies when at limit", async () => {
        const mockGroup = createMockGroup();
        const activeRally = createMockRally();

        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (Rally.find as Mock).mockResolvedValueOnce([activeRally]); // already at rallyCount=1

        const result = await activateRallies(mockUserId, mockGroupId);

        expect(result.rallies).toHaveLength(1);
    });

    it("calls isUserAdmin for authorization", async () => {
        const mockGroup = createMockGroup();
        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (Rally.find as Mock)
            .mockResolvedValueOnce([])
            .mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });

        await activateRallies(mockUserId, mockGroupId);

        expect(isUserAdmin).toHaveBeenCalledWith(mockUserId, mockGroupId);
    });
});

// ─── getSubmissions ────────────────────────────────────────────────────────

describe("getSubmissions", () => {
    it("returns submissions with presigned URLs sorted by votes", async () => {
        const submissions = [
            {
                _id: new Types.ObjectId(),
                userId: new Types.ObjectId(),
                imageKey: "group1/rally/r1/photo1.jpg",
                votes: [{ user: new Types.ObjectId() }],
                toObject: vi.fn().mockReturnValue({
                    _id: "sub1",
                    imageKey: "group1/rally/r1/photo1.jpg",
                    votes: [{ user: "u1" }],
                }),
            },
            {
                _id: new Types.ObjectId(),
                userId: new Types.ObjectId(),
                imageKey: "group1/rally/r1/photo2.jpg",
                votes: [{ user: new Types.ObjectId() }, { user: new Types.ObjectId() }],
                toObject: vi.fn().mockReturnValue({
                    _id: "sub2",
                    imageKey: "group1/rally/r1/photo2.jpg",
                    votes: [{ user: "u1" }, { user: "u2" }],
                }),
            },
        ];

        (Rally.findById as Mock).mockResolvedValue(createMockRally({ submissions }));
        (User.find as Mock).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

        const result = await getSubmissions(mockUserId, mockGroupId, mockRallyId);

        expect(result).toHaveLength(2);
        // Sorted by votes descending
        expect(result[0].votes).toHaveLength(2);
        expect(result[1].votes).toHaveLength(1);
        // URLs should be replaced with signed URLs
        expect(result[0].imageUrl).toBe("https://signed-url.example.com/image.jpg");
    });

    it("throws NotFoundError when rally doesn't exist", async () => {
        (Rally.findById as Mock).mockResolvedValue(null);

        await expect(getSubmissions(mockUserId, mockGroupId, mockRallyId)).rejects.toThrow(
            NotFoundError
        );
    });
});

// ─── addSubmission ─────────────────────────────────────────────────────────

describe("addSubmission", () => {
    it("adds a submission and awards points", async () => {
        const mockGroup = createMockGroup();
        const mockUser = createMockUser();
        const rally = createMockRally({ submissions: [] });
        const updatedRally = createMockRally();

        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (User.findById as Mock).mockResolvedValue(mockUser);
        (Rally.findById as Mock).mockResolvedValue(rally);
        (Rally.findByIdAndUpdate as Mock).mockResolvedValue(updatedRally);

        const result = await addSubmission(
            mockUserId,
            mockGroupId,
            mockRallyId,
            "group1/rally/r1/photo.jpg"
        );

        expect(Rally.findByIdAndUpdate).toHaveBeenCalledWith(
            mockRallyId,
            {
                $push: {
                    submissions: expect.objectContaining({
                        imageKey: "group1/rally/r1/photo.jpg",
                    }),
                },
            },
            { new: true, runValidators: true }
        );
        expect(addPointsToMember).toHaveBeenCalledWith(mockGroup, mockUserId, 2);
        expect(result).toBe(updatedRally);
    });

    it("throws ValidationError when imageKey is missing", async () => {
        await expect(addSubmission(mockUserId, mockGroupId, mockRallyId, "")).rejects.toThrow(
            ValidationError
        );
    });

    it("throws ValidationError when rally is not in submission phase", async () => {
        const rally = createMockRally({ status: RallyStatus.Voting, submissions: [] });

        (Group.findById as Mock).mockResolvedValue(createMockGroup());
        (User.findById as Mock).mockResolvedValue(createMockUser());
        (Rally.findById as Mock).mockResolvedValue(rally);

        await expect(
            addSubmission(mockUserId, mockGroupId, mockRallyId, "group1/rally/r1/photo.jpg")
        ).rejects.toThrow(ValidationError);
    });

    it("throws ConflictError when user already submitted", async () => {
        const rally = createMockRally({
            submissions: [
                {
                    _id: new Types.ObjectId(),
                    userId: new Types.ObjectId(mockUserId),
                    imageKey: "group1/rally/r1/existing.jpg",
                    votes: [],
                },
            ],
        });

        (Group.findById as Mock).mockResolvedValue(createMockGroup());
        (User.findById as Mock).mockResolvedValue(createMockUser());
        (Rally.findById as Mock).mockResolvedValue(rally);

        await expect(
            addSubmission(mockUserId, mockGroupId, mockRallyId, "group1/rally/r1/new.jpg")
        ).rejects.toThrow(ConflictError);
    });
});

// ─── voteOnSubmission ──────────────────────────────────────────────────────

describe("voteOnSubmission", () => {
    function createRallyWithSubmission(
        submissionUserId: string = mockOtherUserId,
        votes: { user: Types.ObjectId }[] = []
    ) {
        return createMockRally({
            status: RallyStatus.Voting,
            submissions: [
                {
                    _id: new Types.ObjectId(mockSubmissionId),
                    userId: new Types.ObjectId(submissionUserId),
                    imageKey: "group1/rally/r1/photo.jpg",
                    votes,
                    username: "otheruser",
                },
            ],
        });
    }

    it("adds a vote atomically and awards points", async () => {
        const rally = createRallyWithSubmission();
        const mockGroup = createMockGroup();

        (Group.findById as Mock).mockResolvedValue(mockGroup);
        (Rally.findOne as Mock).mockResolvedValue(rally);
        (Rally.updateOne as Mock).mockResolvedValue({ modifiedCount: 1 });

        await voteOnSubmission(mockUserId, mockGroupId, mockRallyId, mockSubmissionId);

        expect(Rally.updateOne).toHaveBeenCalledWith(
            {
                _id: mockRallyId,
                submissions: {
                    $elemMatch: {
                        _id: new Types.ObjectId(mockSubmissionId),
                        "votes.user": { $ne: new Types.ObjectId(mockUserId) },
                    },
                },
            },
            {
                $push: {
                    "submissions.$.votes": {
                        user: new Types.ObjectId(mockUserId),
                        time: expect.any(Date),
                    },
                },
            }
        );
        expect(addPointsToMember).toHaveBeenCalledWith(mockGroup, mockUserId, 1);
    });

    it("throws ConflictError when user votes on own submission (self-vote prevention)", async () => {
        const rally = createRallyWithSubmission(mockUserId);
        (Group.findById as Mock).mockResolvedValue(createMockGroup());
        (Rally.findOne as Mock).mockResolvedValue(rally);

        await expect(
            voteOnSubmission(mockUserId, mockGroupId, mockRallyId, mockSubmissionId)
        ).rejects.toThrow(ConflictError);
        await expect(
            voteOnSubmission(mockUserId, mockGroupId, mockRallyId, mockSubmissionId)
        ).rejects.toThrow("You cannot vote on your own submission");
    });

    it("throws ConflictError when atomic update matches no document (duplicate vote)", async () => {
        const rally = createRallyWithSubmission();
        (Group.findById as Mock).mockResolvedValue(createMockGroup());
        (Rally.findOne as Mock).mockResolvedValue(rally);
        (Rally.updateOne as Mock).mockResolvedValue({ modifiedCount: 0 });

        await expect(
            voteOnSubmission(mockUserId, mockGroupId, mockRallyId, mockSubmissionId)
        ).rejects.toThrow(ConflictError);
        await expect(
            voteOnSubmission(mockUserId, mockGroupId, mockRallyId, mockSubmissionId)
        ).rejects.toThrow("User already voted");
    });

    it("throws ValidationError when voting is not open", async () => {
        const rally = createRallyWithSubmission();
        rally.status = RallyStatus.Submission;

        (Group.findById as Mock).mockResolvedValue(createMockGroup());
        (Rally.findOne as Mock).mockResolvedValue(rally);

        await expect(
            voteOnSubmission(mockUserId, mockGroupId, mockRallyId, mockSubmissionId)
        ).rejects.toThrow(ValidationError);
        await expect(
            voteOnSubmission(mockUserId, mockGroupId, mockRallyId, mockSubmissionId)
        ).rejects.toThrow("Voting is not open for this rally");
    });

    it("throws NotFoundError when rally doesn't exist", async () => {
        (Group.findById as Mock).mockResolvedValue(createMockGroup());
        (Rally.findOne as Mock).mockResolvedValue(null);

        await expect(
            voteOnSubmission(mockUserId, mockGroupId, mockRallyId, mockSubmissionId)
        ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when submission doesn't exist", async () => {
        const rally = createMockRally({ status: RallyStatus.Voting, submissions: [] });
        (Group.findById as Mock).mockResolvedValue(createMockGroup());
        (Rally.findOne as Mock).mockResolvedValue(rally);

        await expect(
            voteOnSubmission(mockUserId, mockGroupId, mockRallyId, new Types.ObjectId().toString())
        ).rejects.toThrow(NotFoundError);
    });
});
