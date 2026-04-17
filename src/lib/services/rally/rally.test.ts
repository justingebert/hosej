import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

vi.mock("@/lib/integrations/push", () => import("@/test/fakes/push"));
vi.mock("@/lib/integrations/storage", () => import("@/test/fakes/storage"));

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser, makeGroup, makeRally } from "@/test/factories";
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
import { getPushCalls, resetPushFake } from "@/test/fakes/push";
import { resetStorageFake } from "@/test/fakes/storage";
import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from "@/lib/api/errorHandling";
import { RallyStatus } from "@/types/models/rally";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(async () => {
    await clearCollections();
    resetPushFake();
    resetStorageFake();
    vi.clearAllMocks();
});

describe("getActiveRallies", () => {
    it("returns empty array when no active rallies exist", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });

        const result = await getActiveRallies(user._id.toString(), group._id.toString());

        expect(result.rallies).toEqual([]);
        expect(result.message).toBe("No active rallies");
    });

    it("returns rallies in submission/voting/results status", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });
        await makeRally({ groupId: group._id, status: RallyStatus.Submission });
        await makeRally({ groupId: group._id, status: RallyStatus.Voting });
        await makeRally({ groupId: group._id, status: RallyStatus.Created });

        const result = await getActiveRallies(user._id.toString(), group._id.toString());

        expect(result.rallies).toHaveLength(2);
    });

    it("does not mutate rally state or send notifications", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });
        const rally = await makeRally({ groupId: group._id, status: RallyStatus.Submission });

        await getActiveRallies(user._id.toString(), group._id.toString());

        const reloaded = await Rally.findById(rally._id);
        expect(reloaded?.status).toBe(RallyStatus.Submission);
        expect(getPushCalls()).toHaveLength(0);
    });

    it("throws when group doesn't exist", async () => {
        const user = await makeUser();

        await expect(
            getActiveRallies(user._id.toString(), new Types.ObjectId().toString())
        ).rejects.toThrow(NotFoundError);
    });
});

describe("processRallyStateTransitions", () => {
    it("silently returns when group not found", async () => {
        await expect(
            processRallyStateTransitions(new Types.ObjectId().toString())
        ).resolves.toBeUndefined();
    });

    it("silently returns when no processable rallies", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });

        await expect(processRallyStateTransitions(group._id.toString())).resolves.toBeUndefined();
        expect(getPushCalls()).toHaveLength(0);
    });

    it("transitions scheduled → submission when start time arrives", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const rally = await makeRally({
            groupId: group._id,
            status: RallyStatus.Scheduled,
            startTime: new Date(Date.now() - 1000),
        });
        rally.submissionEnd = new Date(Date.now() + 86400000);
        await rally.save();

        await processRallyStateTransitions(group._id.toString());

        const reloaded = await Rally.findById(rally._id);
        expect(reloaded?.status).toBe(RallyStatus.Submission);

        const pushes = getPushCalls();
        expect(pushes.length).toBeGreaterThan(0);
        expect(pushes[0].title).toContain("Rally Started");
    });

    it("does not transition scheduled rally before start time", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const rally = await makeRally({
            groupId: group._id,
            status: RallyStatus.Scheduled,
            startTime: new Date(Date.now() + 86400000),
        });

        await processRallyStateTransitions(group._id.toString());

        const reloaded = await Rally.findById(rally._id);
        expect(reloaded?.status).toBe(RallyStatus.Scheduled);
    });

    it("transitions submission → voting when submissionEnd passes", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const rally = await makeRally({
            groupId: group._id,
            status: RallyStatus.Submission,
        });
        rally.submissionEnd = new Date(Date.now() - 1000);
        await rally.save();

        await processRallyStateTransitions(group._id.toString());

        const reloaded = await Rally.findById(rally._id);
        expect(reloaded?.status).toBe(RallyStatus.Voting);
        expect(reloaded?.votingEnd).toBeInstanceOf(Date);

        const pushes = getPushCalls();
        expect(pushes[0].title).toContain("Voting");
    });

    it("transitions voting → results when votingEnd passes", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const rally = await makeRally({
            groupId: group._id,
            status: RallyStatus.Voting,
        });
        rally.votingEnd = new Date(Date.now() - 1000);
        await rally.save();

        await processRallyStateTransitions(group._id.toString());

        const reloaded = await Rally.findById(rally._id);
        expect(reloaded?.status).toBe(RallyStatus.Results);
        expect(reloaded?.resultsEnd).toBeInstanceOf(Date);

        const pushes = getPushCalls();
        expect(pushes[0].title).toContain("Results");
    });

    it("transitions results → completed and activates next rally", async () => {
        const user = await makeUser();
        const group = await makeGroup({ admin: user._id });
        const rally = await makeRally({
            groupId: group._id,
            status: RallyStatus.Results,
        });
        rally.resultsEnd = new Date(Date.now() - 1000);
        await rally.save();
        const nextRally = await makeRally({
            groupId: group._id,
            status: RallyStatus.Created,
            startTime: null,
        });

        await processRallyStateTransitions(group._id.toString());

        const reloadedCurrent = await Rally.findById(rally._id);
        const reloadedNext = await Rally.findById(nextRally._id);
        expect(reloadedCurrent?.status).toBe(RallyStatus.Completed);
        expect(reloadedNext?.status).toBe(RallyStatus.Scheduled);
        expect(reloadedNext?.startTime).toBeInstanceOf(Date);
        expect(reloadedNext?.submissionEnd).toBeInstanceOf(Date);
    });
});

describe("createRallyByUser", () => {
    it("creates a rally with chat and awards points", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U", points: 0 }],
        });

        await createRallyByUser(user._id.toString(), group._id.toString(), {
            task: "Take a photo",
            lengthInDays: 3,
        });

        const rally = await Rally.findOne({ groupId: group._id });
        expect(rally?.task).toBe("Take a photo");
        expect(rally?.chat).toBeTruthy();

        const reloaded = await Group.findById(group._id);
        expect(reloaded?.members[0].points).toBeGreaterThan(0);
    });

    it("throws ValidationError when task is missing", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });

        await expect(
            createRallyByUser(user._id.toString(), group._id.toString(), {
                task: "",
                lengthInDays: 3,
            })
        ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when lengthInDays is missing", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });

        await expect(
            createRallyByUser(user._id.toString(), group._id.toString(), {
                task: "Test",
                lengthInDays: 0,
            })
        ).rejects.toThrow(ValidationError);
    });

    it("throws ForbiddenError when user not in group", async () => {
        const owner = await makeUser();
        const outsider = await makeUser();
        const group = await makeGroup({
            admin: owner._id,
            members: [{ user: owner._id, name: "O" }],
        });

        await expect(
            createRallyByUser(outsider._id.toString(), group._id.toString(), {
                task: "Test",
                lengthInDays: 3,
            })
        ).rejects.toThrow(ForbiddenError);
    });
});

describe("activateRallies", () => {
    it("activates pending rallies up to the configured count", async () => {
        const admin = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [{ user: admin._id, name: "A" }],
        });
        const pending = await makeRally({ groupId: group._id, status: RallyStatus.Created });

        const result = await activateRallies(admin._id.toString(), group._id.toString());

        const reloaded = await Rally.findById(pending._id);
        expect(reloaded?.status).toBe(RallyStatus.Submission);
        expect(reloaded?.startTime).toBeInstanceOf(Date);
        expect(reloaded?.submissionEnd).toBeInstanceOf(Date);
        expect(result.rallies).toHaveLength(1);
    });

    it("returns already active rallies when at limit", async () => {
        const admin = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [{ user: admin._id, name: "A" }],
        });
        await makeRally({ groupId: group._id, status: RallyStatus.Submission });
        await makeRally({ groupId: group._id, status: RallyStatus.Created });

        const result = await activateRallies(admin._id.toString(), group._id.toString());

        expect(result.rallies).toHaveLength(1);
        const stillCreated = await Rally.find({
            groupId: group._id,
            status: RallyStatus.Created,
        });
        expect(stillCreated).toHaveLength(1);
    });

    it("requires admin authorization", async () => {
        const admin = await makeUser();
        const member = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [
                { user: admin._id, name: "A" },
                { user: member._id, name: "M" },
            ],
        });

        await expect(activateRallies(member._id.toString(), group._id.toString())).rejects.toThrow(
            ForbiddenError
        );
    });
});

describe("getSubmissions", () => {
    it("returns submissions with presigned URLs sorted by votes", async () => {
        const admin = await makeUser();
        const submitter1 = await makeUser();
        const submitter2 = await makeUser();
        const voter1 = await makeUser();
        const voter2 = await makeUser();
        const group = await makeGroup({
            admin: admin._id,
            members: [{ user: admin._id, name: "A" }],
        });
        const rally = await makeRally({ groupId: group._id, status: RallyStatus.Voting });
        rally.submissions.push(
             
            {
                userId: submitter1._id,
                imageKey: "group1/rally/r1/photo1.jpg",
                votes: [{ user: voter1._id, time: new Date() }],
            } as any,
             
            {
                userId: submitter2._id,
                imageKey: "group1/rally/r1/photo2.jpg",
                votes: [
                    { user: voter1._id, time: new Date() },
                    { user: voter2._id, time: new Date() },
                ],
            } as any
        );
        await rally.save();

        const result = await getSubmissions(
            admin._id.toString(),
            group._id.toString(),
            rally._id.toString()
        );

        expect(result).toHaveLength(2);
        expect((result[0].votes as unknown[]).length).toBe(2);
        expect((result[1].votes as unknown[]).length).toBe(1);
        expect(result[0].imageUrl).toBe("https://fake-s3.example.com/group1/rally/r1/photo2.jpg");
    });

    it("throws NotFoundError when rally doesn't exist", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });

        await expect(
            getSubmissions(
                user._id.toString(),
                group._id.toString(),
                new Types.ObjectId().toString()
            )
        ).rejects.toThrow(NotFoundError);
    });
});

describe("addSubmission", () => {
    it("adds a submission and awards points", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U", points: 0 }],
        });
        const rally = await makeRally({ groupId: group._id, status: RallyStatus.Submission });

        const result = await addSubmission(
            user._id.toString(),
            group._id.toString(),
            rally._id.toString(),
            "group1/rally/r1/photo.jpg"
        );

        expect(result.submissions).toHaveLength(1);
        expect(result.submissions[0].imageKey).toBe("group1/rally/r1/photo.jpg");

        const reloadedGroup = await Group.findById(group._id);
        expect(reloadedGroup?.members[0].points).toBeGreaterThan(0);
    });

    it("throws ValidationError when imageKey is missing", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });
        const rally = await makeRally({ groupId: group._id, status: RallyStatus.Submission });

        await expect(
            addSubmission(user._id.toString(), group._id.toString(), rally._id.toString(), "")
        ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when rally is not in submission phase", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });
        const rally = await makeRally({ groupId: group._id, status: RallyStatus.Voting });

        await expect(
            addSubmission(
                user._id.toString(),
                group._id.toString(),
                rally._id.toString(),
                "group1/rally/r1/photo.jpg"
            )
        ).rejects.toThrow(ValidationError);
    });

    it("throws ConflictError when user already submitted", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });
        const rally = await makeRally({ groupId: group._id, status: RallyStatus.Submission });
        rally.submissions.push(
             
            {
                userId: user._id,
                imageKey: "group1/rally/r1/existing.jpg",
                votes: [],
            } as any
        );
        await rally.save();

        await expect(
            addSubmission(
                user._id.toString(),
                group._id.toString(),
                rally._id.toString(),
                "group1/rally/r1/new.jpg"
            )
        ).rejects.toThrow(ConflictError);
    });
});

describe("voteOnSubmission", () => {
    async function setupVotingRally(submitterId: Types.ObjectId, voterId: Types.ObjectId) {
        const group = await makeGroup({
            admin: voterId,
            members: [
                { user: voterId, name: "V" },
                { user: submitterId, name: "S" },
            ],
        });
        const rally = await makeRally({ groupId: group._id, status: RallyStatus.Voting });
        rally.submissions.push(
             
            {
                userId: submitterId,
                imageKey: "group1/rally/r1/photo.jpg",
                votes: [],
            } as any
        );
        await rally.save();
        return { group, rally, submissionId: rally.submissions[0]._id as Types.ObjectId };
    }

    it("adds a vote atomically and awards points", async () => {
        const submitter = await makeUser();
        const voter = await makeUser();
        const { group, rally, submissionId } = await setupVotingRally(submitter._id, voter._id);

        await voteOnSubmission(
            voter._id.toString(),
            group._id.toString(),
            rally._id.toString(),
            submissionId.toString()
        );

        const reloaded = await Rally.findById(rally._id);
        expect(reloaded?.submissions[0].votes).toHaveLength(1);
        expect(reloaded?.submissions[0].votes[0].user.toString()).toBe(voter._id.toString());

        const reloadedGroup = await Group.findById(group._id);
        const voterMember = reloadedGroup?.members.find(
            (m) => m.user.toString() === voter._id.toString()
        );
        expect(voterMember?.points).toBeGreaterThan(0);
    });

    it("throws ConflictError when user votes on own submission", async () => {
        const user = await makeUser();
        const { group, rally, submissionId } = await setupVotingRally(user._id, user._id);

        await expect(
            voteOnSubmission(
                user._id.toString(),
                group._id.toString(),
                rally._id.toString(),
                submissionId.toString()
            )
        ).rejects.toThrow(ConflictError);
    });

    it("throws ConflictError on duplicate vote", async () => {
        const submitter = await makeUser();
        const voter = await makeUser();
        const { group, rally, submissionId } = await setupVotingRally(submitter._id, voter._id);

        await voteOnSubmission(
            voter._id.toString(),
            group._id.toString(),
            rally._id.toString(),
            submissionId.toString()
        );

        await expect(
            voteOnSubmission(
                voter._id.toString(),
                group._id.toString(),
                rally._id.toString(),
                submissionId.toString()
            )
        ).rejects.toThrow(ConflictError);
    });

    it("throws ValidationError when voting is not open", async () => {
        const submitter = await makeUser();
        const voter = await makeUser();
        const { group, rally, submissionId } = await setupVotingRally(submitter._id, voter._id);
        rally.status = RallyStatus.Submission;
        await rally.save();

        await expect(
            voteOnSubmission(
                voter._id.toString(),
                group._id.toString(),
                rally._id.toString(),
                submissionId.toString()
            )
        ).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when rally doesn't exist", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });

        await expect(
            voteOnSubmission(
                user._id.toString(),
                group._id.toString(),
                new Types.ObjectId().toString(),
                new Types.ObjectId().toString()
            )
        ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when submission doesn't exist", async () => {
        const user = await makeUser();
        const group = await makeGroup({
            admin: user._id,
            members: [{ user: user._id, name: "U" }],
        });
        const rally = await makeRally({ groupId: group._id, status: RallyStatus.Voting });

        await expect(
            voteOnSubmission(
                user._id.toString(),
                group._id.toString(),
                rally._id.toString(),
                new Types.ObjectId().toString()
            )
        ).rejects.toThrow(NotFoundError);
    });
});
