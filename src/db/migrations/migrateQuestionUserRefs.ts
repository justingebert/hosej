// import mongoose from 'mongoose';
// import User from '../models/user'; // User model
// import Question from '../models/Question'; // Question model
//
// async function migrateQuestions() {
//   try {
//     await mongoose.connect('mongodb://localhost:27017/hosej'); // Replace with your DB URL
//
//     console.log('Starting migration of questions...');
//
//     // Fetch all questions
//     const questions = await Question.find({}).lean();
//
//     for (const question of questions) {
//       console.log(`Migrating question: ${question._id}`);
//
//       // Update submittedBy to reference a User if it is a string (username)
//       if (typeof question.submittedBy === 'string') {
//         const user = await User.findOne({ username: question.submittedBy }).lean() as any;
//         if (user) {
//           question.submittedBy = user._id;
//         }
//       }
//
//       // Update rating to arrays of user references
//       for (const ratingType of ['good', 'ok', 'bad']) {
//         const usernames = question.rating?.[ratingType]?.usernames || [];
//         const userRefs = [];
//
//         for (const username of usernames) {
//           const user = await User.findOne({ username }).lean() as any;
//           if (user) {
//             userRefs.push(user._id);
//           }
//         }
//
//         question.rating[ratingType] = userRefs;
//       }
//
//       // Update answers to reference users instead of usernames
//       for (const answer of question.answers) {
//           const user = await User.findById(answer.username).lean() as any;
//           if (user) {
//             answer.user = user._id;
//           }
//         delete answer.username;
//       }
//
//       // Update the question document with the new structure
//       await Question.updateOne({ _id: question._id }, question);
//       console.log(`Migrated question: ${question._id}`);
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
// migrateQuestions();
