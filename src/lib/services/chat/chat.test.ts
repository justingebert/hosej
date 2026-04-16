import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";

import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser, makeGroup, makeChat } from "@/test/factories";
import { createChatForEntity, getChatById, addMessage } from "./chat";
import Chat from "@/db/models/Chat";
import { NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { EntityModel } from "@/types/models/chat";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);

describe("createChatForEntity", () => {
    it("creates and persists a chat with entity data", async () => {
        const group = await makeGroup();
        const entityId = new Types.ObjectId();

        const result = await createChatForEntity(group._id, entityId, EntityModel.Question);

        expect(result.entity.toString()).toBe(entityId.toString());
        expect(result.entityModel).toBe(EntityModel.Question);
        expect(result.messages).toHaveLength(0);

        const stored = await Chat.findById(result._id);
        expect(stored?.entity.toString()).toBe(entityId.toString());
    });

    it("passes the correct entity model for Rally", async () => {
        const group = await makeGroup();
        const entityId = new Types.ObjectId();

        const result = await createChatForEntity(group._id, entityId, EntityModel.Rally);

        expect(result.entityModel).toBe(EntityModel.Rally);
    });
});

describe("getChatById", () => {
    it("returns a chat with populated message users", async () => {
        const user = await makeUser({ username: "TestUser" });
        const chat = await makeChat({
            messages: [{ user: user._id, message: "Hello" }],
        });

        const result = await getChatById(chat._id.toString());

        expect(result.messages).toHaveLength(1);
        const msgUser = result.messages[0].user as unknown as { username: string };
        expect(msgUser.username).toBe("TestUser");
    });

    it("throws NotFoundError when chat not found", async () => {
        await expect(getChatById(new Types.ObjectId().toString())).rejects.toThrow(NotFoundError);
    });
});

describe("addMessage", () => {
    it("adds a message and persists it", async () => {
        const user = await makeUser();
        const chat = await makeChat();

        const result = await addMessage(chat._id.toString(), user._id.toString(), "Hello!");

        expect(result.message).toBe("Hello!");

        const reloaded = await Chat.findById(chat._id);
        expect(reloaded?.messages).toHaveLength(1);
        expect(reloaded?.messages[0].message).toBe("Hello!");
    });

    it("trims the message before saving", async () => {
        const user = await makeUser();
        const chat = await makeChat();

        await addMessage(chat._id.toString(), user._id.toString(), "  Hello!  ");

        const reloaded = await Chat.findById(chat._id);
        expect(reloaded?.messages[0].message).toBe("Hello!");
    });

    it("throws ValidationError for empty message", async () => {
        const user = await makeUser();
        const chat = await makeChat();

        await expect(addMessage(chat._id.toString(), user._id.toString(), "")).rejects.toThrow(
            ValidationError
        );
        await expect(addMessage(chat._id.toString(), user._id.toString(), "   ")).rejects.toThrow(
            ValidationError
        );
    });

    it("throws ValidationError for non-string message", async () => {
        const user = await makeUser();
        const chat = await makeChat();

        await expect(
            addMessage(chat._id.toString(), user._id.toString(), null as unknown as string)
        ).rejects.toThrow(ValidationError);
        await expect(
            addMessage(chat._id.toString(), user._id.toString(), undefined as unknown as string)
        ).rejects.toThrow(ValidationError);
    });

    it("throws NotFoundError when chat not found", async () => {
        const user = await makeUser();

        await expect(
            addMessage(new Types.ObjectId().toString(), user._id.toString(), "Hello")
        ).rejects.toThrow(NotFoundError);
    });
});
