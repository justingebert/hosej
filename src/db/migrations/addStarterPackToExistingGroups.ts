/**
 * Migration Script: Add Starter Pack to Existing Groups
 *
 * This script adds the starter pack questions to all existing groups
 * that don't already have them.
 *
 * NOTE: You should first upload the starter pack via admin UI at /admin
 */

import dbConnect from "../dbConnect";
import Group from "../models/Group";
import Question from "../models/Question";
import { addTemplatePackToGroup } from "@/lib/template-questions/addPackToGroup";

async function addStarterPackToExistingGroups() {
    try {
        console.log("🔄 Connecting to database...");
        await dbConnect();

        console.log("📦 Fetching all groups...");
        const groups = await Group.find({});
        console.log(`Found ${groups.length} groups`);

        const successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const group of groups) {
            try {
                console.log(`\n📋 Processing group: ${group.name} (${group._id})`);

                // Check if group already has questions from the starter pack
                // (questions with templateId set)
                const existingTemplateQuestions = await Question.countDocuments({
                    groupId: group._id,
                    templateId: { $exists: true, $ne: null },
                });

                if (existingTemplateQuestions > 0) {
                    console.log(
                        `  ⏭️  Skipping - already has ${existingTemplateQuestions} template questions`
                    );
                    skipCount++;
                    continue;
                }

                // Add starter pack
                await addTemplatePackToGroup(group._id, "starter-pack-v1");
            } catch (error) {
                console.error(`  ❌ Error processing group ${group.name}:`, error);
                errorCount++;
            }
        }

        console.log("\n" + "=".repeat(50));
        console.log("📊 Migration Summary:");
        console.log(`  ✅ Successfully migrated: ${successCount}`);
        console.log(`  ⏭️  Skipped (already had templates): ${skipCount}`);
        console.log(`  ❌ Errors: ${errorCount}`);
        console.log(`  📦 Total groups: ${groups.length}`);
        console.log("=".repeat(50));

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    }
}

// Run the migration
addStarterPackToExistingGroups();
