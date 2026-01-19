#!/usr/bin/env node

/**
 * Migration Script: Group Structure Refactoring
 *
 * This script migrates existing groups from the old structure to the new nested features structure.
 *
 * Old structure:
 *   - questionCount, lastQuestionDate, rallyCount, rallyGapDays at top level
 *   - jukeboxSettings as separate object
 *   - features with boolean values
 *
 * New structure:
 *   - features.questions.enabled + features.questions.settings
 *   - features.rallies.enabled + features.rallies.settings
 *   - features.jukebox.enabled + features.jukebox.settings
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function migrateGroups() {
    console.log("🔧 Starting group structure migration...\n");

    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error("❌ MONGODB_URI environment variable is not set");
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB\n");

        const db = mongoose.connection.db as any;
        const groupsCollection = db.collection('groups');

        // Find all groups that need migration
        const oldGroups = await groupsCollection.find({
            $or: [
                { questionCount: { $exists: true } },
                { rallyCount: { $exists: true } },
                { rallyGapDays: { $exists: true } },
                { lastQuestionDate: { $exists: true } },
                { jukeboxSettings: { $exists: true } }
            ]
        }).toArray();

        console.log(`📊 Found ${oldGroups.length} groups to migrate\n`);

        if (oldGroups.length === 0) {
            console.log("✨ No groups need migration. All groups are already using the new structure!");
            await mongoose.disconnect();
            return;
        }

        let migratedCount = 0;
        let errorCount = 0;

        for (const group of oldGroups) {
            try {
                // Build the update object
                const update: any = {
                    $set: {
                        // Questions feature
                        'features.questions.enabled':
                            group.features?.questions ?? true,
                        'features.questions.settings.questionCount':
                            group.questionCount ?? 1,
                        'features.questions.settings.lastQuestionDate':
                            group.lastQuestionDate ?? null,

                        // Rallies feature
                        'features.rallies.enabled':
                            group.features?.rallies ?? true,
                        'features.rallies.settings.rallyCount':
                            group.rallyCount ?? 1,
                        'features.rallies.settings.rallyGapDays':
                            group.rallyGapDays ?? 14,

                        // Jukebox feature
                        'features.jukebox.enabled':
                            group.jukeboxSettings?.enabled ?? group.features?.jukebox ?? true,
                        'features.jukebox.settings.concurrent':
                            group.jukeboxSettings?.concurrent ?? ["Jukebox"],
                        'features.jukebox.settings.activationDays':
                            group.jukeboxSettings?.activationDays ?? [1],
                    },
                    $unset: {
                        // Remove old top-level fields
                        questionCount: "",
                        lastQuestionDate: "",
                        rallyCount: "",
                        rallyGapDays: "",
                        jukeboxSettings: ""
                    }
                };

                await groupsCollection.updateOne(
                    { _id: group._id },
                    update
                );

                console.log(`✅ Migrated: ${group.name} (${group._id})`);
                migratedCount++;

            } catch (error) {
                console.error(`❌ Error migrating group ${group.name}:`, error);
                errorCount++;
            }
        }

        console.log("\n" + "=".repeat(50));
        console.log("📊 Migration Summary:");
        console.log("=".repeat(50));
        console.log(`Total groups found:     ${oldGroups.length}`);
        console.log(`Successfully migrated:  ${migratedCount}`);
        console.log(`Errors:                 ${errorCount}`);
        console.log("=".repeat(50) + "\n");

        if (errorCount === 0) {
            console.log("✨ Migration completed successfully!");
        } else {
            console.log("⚠️  Migration completed with errors. Please review the logs above.");
        }

        await mongoose.disconnect();
        console.log("\n✅ Disconnected from MongoDB");

    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the migration
console.log("\n" + "=".repeat(50));
console.log("  Group Structure Migration");
console.log("=".repeat(50) + "\n");

migrateGroups()
    .then(() => {
        console.log("\n🎉 All done!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Fatal error:", error);
        process.exit(1);
    });

