// import mongoose from "mongoose";
// import User from '../models/user'; // Import your new User model
//
// async function migrateUserPointsAndStreaks() {
//   try {
//     await mongoose.connect('mongodb://localhost:27017/hosej');
//
//     console.log('Starting migration of user points and streaks...');
//
//     const groupId = '66c9f1307cfaf063db4777e3';
//     const today = new Date();
//
//     // Fetch all users and return raw documents with lean()
//     const users = await User.find({}).lean(); // Use .lean() to access raw data
//
//     for (let user of users) {
//         const totalPoints = user.totalPoints || 0; // Get totalPoints even if it's no longer in the schema
//         const streak = user.streak || 0; // Get streak even if it's no longer in the schema
//
//         console.log(`Migrating user: ${user.username} (${user._id})`);
//         console.log(`Total points: ${totalPoints}`);
//         console.log(`Streak: ${streak}`);
//
//         // Prepare the group points and streak
//         user.groups = [{
//           group: groupId,
//           points: totalPoints,
//           streak: streak,
//           lastPointDate: today
//         }];
//
//         // Remove the old fields
//         delete user.totalPoints;
//         delete user.streak;
//
//         // Update the user with the new group structure
//         await User.updateOne({ _id: user._id }, user);
//         console.log(`Migrated user: ${user.username} (${user._id})`);
//     }
//
//     console.log('Migration complete!');
//   } catch (error) {
//     console.error('Error during migration:', error);
//   } finally {
//     mongoose.connection.close();
//   }
// }
//
// migrateUserPointsAndStreaks();
