import mongoose from "mongoose";
import User from "./models/User";  // Path to your updated User model
import Points from "./models/Points";  // Path to your new Points model

async function migratePoints() {
    try {
        await mongoose.connect('mongodb://localhost:27017/yourdatabase'); // Update with your MongoDB URI

        // Fetch all users who have points entries
        const users = await User.find({ points: { $exists: true, $ne: [] } });

        for (const user of users) {
            let totalPoints = 0;

            // Create Points documents for each entry in the user's points array
            for (const entry of user.points) {
                const pointsDocument = new Points({
                    user: user._id,
                    points: entry.points,
                    date: entry.date,
                });

                await pointsDocument.save();
                totalPoints = entry.points;  // The last entry will have the cumulative points
            }

            // Update the user document
            user.totalPoints = totalPoints;  // Set the total points
            user.points = [];  // Clear the old points array

            await user.save();
        }

        console.log('Points migration completed successfully!');
    } catch (error) {
        console.error('Error during points migration:', error);
    } finally {
        mongoose.connection.close();
    }
}

migratePoints();
