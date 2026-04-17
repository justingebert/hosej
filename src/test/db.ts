import mongoose from "mongoose";
import dbConnect from "@/db/dbConnect";

export async function setupTestDb() {
    await dbConnect();
}

export async function teardownTestDb() {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
}

export async function clearCollections() {
    const db = mongoose.connection.db;
    if (!db) return;
    const collections = await db.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
}
