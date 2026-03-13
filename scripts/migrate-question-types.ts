/**
 * Migration script: Convert old composite question types to new base type + multiSelect.
 *
 * Usage:  npx tsx scripts/migrate-question-types.ts
 *
 * Requires MONGODB_URI env var (reads .env.local automatically via dotenv).
 */

import config from "dotenv";
import mongoose from "mongoose";

config.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("MONGODB_URI environment variable is required");
    process.exit(1);
}

const TYPE_MAP: Record<string, { questionType: string; multiSelect: boolean }> = {
    "users-select-one": { questionType: "users", multiSelect: false },
    "users-select-multiple": { questionType: "users", multiSelect: true },
    "custom-select-one": { questionType: "custom", multiSelect: false },
    "custom-select-multiple": { questionType: "custom", multiSelect: true },
    text: { questionType: "text", multiSelect: false },
    rating: { questionType: "rating", multiSelect: false },
    "image-select-one": { questionType: "image", multiSelect: false },
    "image-select-multiple": { questionType: "image", multiSelect: true },
};

async function migrate() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    const db = mongoose.connection.db!;

    for (const collection of ["questions", "questiontemplates"]) {
        console.log(`\nMigrating collection: ${collection}`);

        for (const [oldType, newFields] of Object.entries(TYPE_MAP)) {
            const result = await db.collection(collection).updateMany(
                { questionType: oldType },
                {
                    $set: {
                        questionType: newFields.questionType,
                        multiSelect: newFields.multiSelect,
                    },
                }
            );

            if (result.modifiedCount > 0) {
                console.log(
                    `  ${oldType} -> ${newFields.questionType} (multiSelect: ${newFields.multiSelect}): ${result.modifiedCount} docs`
                );
            }
        }

        // Verify no old types remain
        const oldTypes = Object.keys(TYPE_MAP);
        const remaining = await db
            .collection(collection)
            .countDocuments({ questionType: { $in: oldTypes } });

        if (remaining > 0) {
            console.error(`  WARNING: ${remaining} documents still have old type values!`);
        } else {
            console.log(`  All documents migrated successfully.`);
        }
    }

    await mongoose.disconnect();
    console.log("\nDone.");
}

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
