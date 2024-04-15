import mongoose from "mongoose";
import Question from "./models/Question";
import User from "./models/User";
require('dotenv').config({ path: './.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
}

mongoose.connect(MONGODB_URI, {
});

const createData = async () => {
    const questions = [
        {
        category: "Daily",
        questionType: "users-select-one",
        question: "Who is most likely to binge an entire TV series in one weekend?",
        },
        {
        category: "Daily",
        questionType: "users-select-one",
        question: "Who can make everyone laugh even on a bad day?",
        },
        {
        category: "Daily",
        questionType: "users-select-one",
        question: "Who is the fitness enthusiast who never misses a workout?",
        },
        {
        category: "Daily",
        questionType: "users-select-one",
        question: "Who would survive a zombie apocalypse by befriending the zombies?",
        },
        {
        category: "Daily",
        questionType: "users-select-one",
        question: "Who would be the most entertaining to watch trying to assemble furniture without instructions?",
        },
        {
        category: "Daily",
        questionType: "users-select-one",
        question: "Who is most likely to get lost even with GPS help?",
        },
        {
        category: "Daily",
        questionType: "users-select-one",
        question: "Who would be the most likely to accidentally join a cult thinking it was a yoga class?",
        },
    ];

    const users = [
        {
          username: "Justin",
        },
        {
          username: "Jenny",
        },
        {
          username: "Alice",
        },
        {
          username: "Bernd",
        },
        {
          username: "Arsch",
        },
        {
          username: "Felix",
        },
    ];

    
    await Question.deleteMany({});
    await Question.insertMany(questions);

    await User.deleteMany({});
    await User.insertMany(users);
}

createData().then(() => {
    console.log("Data created successfully");
    process.exit();
}).catch((error) => {
    console.log("Error creating data", error);
    process.exit(1);
})