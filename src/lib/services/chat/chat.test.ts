import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Types } from "mongoose";

vi.mock("@/db/models/Chat");
vi.mock("@/db/models/User");

import { createChatForEntity, getChatById, addMessage } from "./chat";
import Chat from "@/db/models/Chat";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { EntityModel } from "@/types/models/chat";

const mockChatId = new Types.ObjectId().toString();
const mockGroupId = new Types.ObjectId().toString();
const mockEntityId = new Types.ObjectId();
const mockUserId = new Types.ObjectId().toString();

function createMockChat(overrides: Record<string, any> = {}) {
    return {
        _id: new Types.ObjectId(mockChatId),
        group: new Types.ObjectId(mockGroupId),
        entity: mockEntityId,
        entityModel: EntityModel.Question,
        messages: [] as any[],
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── createChatForEntity ────────────────────────────────────────────────────

describe("createChatForEntity", () => {
    it("should create and save a chat with correct entity data", async () => {
        let constructorData: any;
        vi.mocked(Chat).mockImplementation(function (this: any, data: any) {
            constructorData = data;
            Object.assign(this, data, { save: vi.fn().mockResolvedValue(undefined) });
            return this;
        } as any);

        const result = await createChatForEntity(mockGroupId, mockEntityId, EntityModel.Question);

        expect(result.save).toHaveBeenCalled();
        expect(constructorData.entity).toEqual(mockEntityId);
        expect(constructorData.entityModel).toBe(EntityModel.Question);
        expect(constructorData.messages).toEqual([]);
    });

    it("should pass the correct entity model for Rally", async () => {
        let constructorData: any;
        vi.mocked(Chat).mockImplementation(function (this: any, data: any) {
            constructorData = data;
            Object.assign(this, data, { save: vi.fn().mockResolvedValue(undefined) });
            return this;
        } as any);

        await createChatForEntity(mockGroupId, mockEntityId, EntityModel.Rally);

        expect(constructorData.entityModel).toBe(EntityModel.Rally);
    });
});

// ─── getChatById ────────────────────────────────────────────────────────────

describe("getChatById", () => {
    it("should return a chat with populated messages", async () => {
        const mockChat = createMockChat({
            messages: [
                {
                    user: { _id: mockUserId, username: "TestUser" },
                    message: "Hello",
                    createdAt: new Date(),
                },
            ],
        });

        const populateMock = vi.fn().mockResolvedValue(mockChat);
        (Chat.findById as Mock).mockReturnValue({ populate: populateMock });

        const result = await getChatById(mockChatId);

        expect(Chat.findById).toHaveBeenCalledWith(mockChatId);
        expect(populateMock).toHaveBeenCalledWith({
            path: "messages.user",
            model: expect.anything(),
        });
        expect(result.messages).toHaveLength(1);
    });

    it("should throw NotFoundError when chat not found", async () => {
        const populateMock = vi.fn().mockResolvedValue(null);
        (Chat.findById as Mock).mockReturnValue({ populate: populateMock });

        await expect(getChatById(mockChatId)).rejects.toThrow(NotFoundError);
    });
});

// ─── addMessage ─────────────────────────────────────────────────────────────

describe("addMessage", () => {
    it("should add a message and return the new subdocument", async () => {
        const newMsg = { user: mockUserId, message: "Hello!", createdAt: new Date() };
        const mockChat = createMockChat({
            messages: {
                push: vi.fn(),
                length: 1,
                0: newMsg,
                [Symbol.iterator]: function* () {
                    yield newMsg;
                },
            } as any,
        });
        // After push, messages[messages.length - 1] should return the new message
        Object.defineProperty(mockChat.messages, "length", { get: () => 1, configurable: true });
        mockChat.messages[0] = newMsg;

        (Chat.findById as Mock).mockResolvedValue(mockChat);

        const result = await addMessage(mockChatId, mockUserId, "Hello!");

        expect(mockChat.messages.push).toHaveBeenCalledWith(
            expect.objectContaining({ user: mockUserId, message: "Hello!" })
        );
        expect(mockChat.save).toHaveBeenCalled();
    });

    it("should trim the message before saving", async () => {
        const mockChat = createMockChat();
        mockChat.messages = [] as any;
        (Chat.findById as Mock).mockResolvedValue(mockChat);

        await addMessage(mockChatId, mockUserId, "  Hello!  ");

        expect(mockChat.messages[0].message).toBe("Hello!");
    });

    it("should throw ValidationError for empty message", async () => {
        await expect(addMessage(mockChatId, mockUserId, "")).rejects.toThrow(ValidationError);
        await expect(addMessage(mockChatId, mockUserId, "   ")).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for non-string message", async () => {
        await expect(addMessage(mockChatId, mockUserId, null as any)).rejects.toThrow(
            ValidationError
        );
        await expect(addMessage(mockChatId, mockUserId, undefined as any)).rejects.toThrow(
            ValidationError
        );
    });

    it("should throw NotFoundError when chat not found", async () => {
        (Chat.findById as Mock).mockResolvedValue(null);

        await expect(addMessage(mockChatId, mockUserId, "Hello")).rejects.toThrow(NotFoundError);
    });
});
