import mongoose from 'mongoose';
import User from '../models/user'; // User model
import Rally from '../models/rally';

async function migrateQuestions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hosej'); // Replace with your DB URL

    console.log('Starting migration of rallies...');

    // Fetch all questions
    const rallies = await Rally.find({}).lean();

    for (const rally of rallies) {
      console.log(`Migrating question: ${rally._id}`);

      // Update submittedBy to reference a User if it is a string (username)
      if (typeof rally.submittedBy === 'string') {
        const user = await User.findOne({ username: rally.submittedBy }).lean() as any;
        if (user) {
          rally.submittedBy = user._id;
        }
      }

      // Update answers to reference users instead of usernames
      for (const submission of rally.submissions) {
        for(let vote of submission.votes) {
          const user = await User.findById(vote.username).lean() as any;
          if (user) {
            vote.user = user._id;
          }
          delete vote.username;
        }
      }

      // Update the question document with the new structure
      await Rally.updateOne({ _id: rally._id }, rally);
      console.log(`Migrated rally: ${rally._id}`);
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    mongoose.connection.close();
  }
}

migrateQuestions();
