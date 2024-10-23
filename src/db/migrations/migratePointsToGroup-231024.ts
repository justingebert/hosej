import mongoose from 'mongoose';
import User from '../models/user'; // User model
import Group from '../models/Group';

async function migratePointsFromUserToGroups() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hosej'); // Replace with your DB URL

    console.log('Starting migration of points...');

    const groups = await Group.find({}).lean();
    for(let group of groups) {
      delete group.members;
      await Group.updateOne({ _id: group._id }, group);
    }

    const users = await User.find({}).lean();
    for(let user of users) {
      console.log(`Migrating user: ${user.username} (${user._id})`);

      for(let group of user.groups) {
        const curGroup = await Group.findById(group.group);
        if(curGroup) {
          group.members.push({
            user: user._id,
            name: user.username,
            points: group.points,
            streak: group.streak,
            lastPointDate: group.lastPointDate,
          })
          await curGroup.save();
        }
      }
      user.groups = user.groups.map((g:any) => ({ group: g.group }));

      await User.updateOne({ _id: user._id }, user);
      console.log(`Migrated user: ${user.username} (${user._id})`);
    }
    

    console.log('Migration complete!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    mongoose.connection.close();
  }
}

migratePointsFromUserToGroups();
