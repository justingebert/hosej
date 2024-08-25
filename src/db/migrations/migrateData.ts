import mongoose from 'mongoose';
import User from '../models/user'; // Adjust the path to your user model
import * as dotenv from 'dotenv';
dotenv.config({path : '../../.env.local'});


//NTO WORKING
mongoose.connect(process.env.MONGODB_URI as string);

const migrateUsers = async () => {
    try {
      const users = await User.find({});
      
      for (const usr of users) {
        if (!usr.points || usr.points.length === 0) {
          usr.points = [{ points: 0, date: new Date() }];
        }
        if (typeof usr.streak === 'undefined') {
          usr.streak = 0;
        }
        await usr.save();
      }
      
      console.log('Migration completed successfully');
      mongoose.connection.close();
    } catch (error) {
      console.error('Error during migration:', error);
      mongoose.connection.close();
    }
  };

migrateUsers();
