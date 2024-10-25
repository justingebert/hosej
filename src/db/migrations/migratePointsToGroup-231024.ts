import mongoose from 'mongoose';
import User from '../models/user'; // User model
import Group from '../models/Group';

async function migratePointsFromUserToGroups() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hosej'); // Replace with your DB URL

    console.log('Starting migration of points...');

    // Fetch all groups and reset members
    const groups = await Group.find({});
    for (let group of groups) {
      await Group.updateOne({ _id: group._id }, { $set: { members: [] } }); // Use $set to clear members array in DB
    }

    // Fetch all users to migrate points
    const users = await User.find({}).lean();
    for (let user of users) {
      console.log(`Migrating user: ${user.username} (${user._id})`);

      // Loop over user's groups and migrate points
      for (let groupInfo of user.groups) {
        const curGroup = await Group.findById(groupInfo.group); // Fetch group by ID
        if (curGroup) {
          // Check if groupInfo fields are defined before using them
          const points = groupInfo.points || 0;
          const streak = groupInfo.streak || 0;
          const lastPointDate = groupInfo.lastPointDate || null;

          // Log these values to debug the source of the error
          console.log(`Migrating points for group ${curGroup._id}: points=${points}, streak=${streak}, lastPointDate=${lastPointDate}`);

          // Add user points and streak data to the group's members array
          curGroup.members.push({
            user: user._id, // Ensure you correctly reference the user's _id
            name: user.username,
            points: points,
            streak: streak,
            lastPointDate: lastPointDate,
          });

          await curGroup.save();
        } else {
          console.warn(`Group with ID ${groupInfo.group} not found for user ${user.username}`);
        }
      }

      // Update user's group field to only include group ObjectIds, not objects
      user.groups = user.groups.map((g: any) => g.group); // Ensure only ObjectId values are saved in groups

      await User.updateOne({ _id: user._id }, { $set: { groups: user.groups } }); // Save updated user with group IDs
      console.log(`Migrated user: ${user.username} (${user._id})`);
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    mongoose.connection.close(); // Ensure the DB connection is closed
  }
}

migratePointsFromUserToGroups();
