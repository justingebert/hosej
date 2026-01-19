/**
 * Admin Setup Script
 *
 * This script helps you add the first admin user to your application.
 * Run this script with: npm run admin:add -- <userId>
 *
 * To get your user ID:
 * 1. Log into the app
 * 2. Open browser console
 * 3. Go to Application/Storage -> Local Storage
 * 4. Or call: POST /api/admin/users with { "userIdToAdd": "YOUR_USER_ID" }
 *
 * If no admin exists, the first user to call the endpoint will become admin.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function addAdminUser(userId: string) {
    try {
        // Get MongoDB URI from environment
        const MONGODB_URI = process.env.MONGODB_URI;

        if (!MONGODB_URI) {
            throw new Error("MONGODB_URI environment variable is not set");
        }

        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Import models after connection
        const AppConfig = (await import("@/db/models/AppConfig")).default;
        const User = (await import("@/db/models/user")).default;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            console.error(`User with ID ${userId} not found`);
            process.exit(1);
        }

        console.log(`Found user: ${user.username}`);

        // Get or create config
        let config = await AppConfig.findOne({ configKey: "global_features" });

        if (!config) {
            config = await AppConfig.create({
                configKey: "global_features",
                features: {
                    questions: true,
                    rallies: true,
                    jukebox: true,
                },
                adminUsers: [userId],
            });
            console.log(`✅ Created config and added ${user.username} as first admin`);
        } else {
            // Check if user is already admin
            const isAdmin = config.adminUsers.some(
                (adminId: mongoose.Types.ObjectId) => adminId.toString() === userId
            );

            if (isAdmin) {
                console.log(`ℹ️  ${user.username} is already an admin`);
            } else {
                config.adminUsers.push(new mongoose.Types.ObjectId(userId));
                await config.save();
                console.log(`✅ Added ${user.username} as admin`);
            }
        }

        console.log(`\nCurrent admins: ${config.adminUsers.length}`);
        console.log(`\nYou can now access the admin panel at: /admin`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
    console.error("Usage: npm run admin:add -- <userId>");
    console.error("\nTo get your user ID:");
    console.error("1. Log into the app");
    console.error("2. Make a GET request to /api/users/me");
    console.error("3. Copy your _id field");
    process.exit(1);
}

addAdminUser(userId);

