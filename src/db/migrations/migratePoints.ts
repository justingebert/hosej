import mongoose from "mongoose";
import User from "../models/user";  // Old User model with the points array
import PointsEntry from "../models/Points";  // New PointsEntry model

const migrateUserPoints = async () => {
  // Connect to your MongoDB database
  await mongoose.connect('mongodb://localhost:27017/hosej');

  try {
    // Fetch all users
    const users = await User.find().lean(); // Use `.lean()` to get plain JavaScript objects

    for (const user of users) {
      const userId = user._id;
      const points = user.points;

      // Log the raw user data for debugging
      console.log(`Processing user: ${userId}`);
      console.log(`Raw points array:`, points);

      // Ensure the points array is valid
      if (!Array.isArray(points)) {
        console.log(`No valid points array found for user: ${userId}`);
        continue;
      }

      // Track total points during migration
      let totalPoints = 0;

      // Create PointsEntry documents for each points entry
      for (const entry of points) {
        const { points: pointValue, date } = entry;

        // Log the entry to verify it is being processed
        console.log(`Processing entry for user ${userId}:`, entry);

        // Ensure the points and date exist in the entry
        if (typeof pointValue !== "number" || !date) {
          console.log(`Invalid points entry for user: ${userId}`);
          continue;
        }

        // Update the total points with the current entry's points value
        totalPoints = pointValue; // assuming the points array is cumulative

        const newPointsEntry = new PointsEntry({
          user: userId,
          points: pointValue,
          date,
        });

        await newPointsEntry.save();
      }

      // Update the user document
      await User.findByIdAndUpdate(userId, {
        totalPoints,
        points: [] // Clear the old points array after migration
      });

    }

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
  }
};

migrateUserPoints().catch(console.error);
