import mongoose from "mongoose";
// import Question from "./models/Question";
// import User from "./models/user";
// import Rally from "./models/rally";
import Jukebox from "./models/Jukebox";
import Chat from "./models/Chat";
require('dotenv').config({ path: '../../.env.local' });

const MONGODB_URI = "mongodb://localhost:27017/hosej";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
}

mongoose.connect(MONGODB_URI, {
});

const createData = async () => {
    await new Chat({group: "66c9f1307cfaf063db4777e3", entityModel: "Jukebox", entity: "67a43500544942ea5304ebed"}).save();
    /* const questions = [
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

    await user.deleteMany({});
    await user.insertMany(users); */

    // const rallies = [
    //   {
    //     task: "Take a photo of the sunset",
    //     startTime: new Date(),
    //     endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    //     resultsShown: false,
    //     used: false,
    //     active: true,
    //     submissions: [],
    //   },
    //   {
    //     task: "Capture the essence of spring",
    //     startTime: new Date(),
    //     endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    //     resultsShown: false,
    //     used: false,
    //     active: false,
    //     submissions: [],
    //   },
    //   {
    //     task: "Photograph your favorite food",
    //     startTime: new Date(),
    //     endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    //     resultsShown: false,
    //     used: false,
    //     active: false,
    //     submissions: [],
    //   },
    //   {
    //     task: "Showcase a local landmark",
    //     startTime: new Date(),
    //     endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    //     resultsShown: false,
    //     used: false,
    //     active: false,
    //     submissions: [],
    //   },
    //   {
    //     task: "Find beauty in the mundane",
    //     startTime: new Date(),
    //     endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    //     resultsShown: false,
    //     used: false,
    //     active: false,
    //     submissions: [],
    //   },
    // ];
  
    // await Rally.deleteMany({});
    // await Rally.insertMany(rallies);
    
}

createData().then(() => {
    console.log("Data created successfully");
    process.exit();
}).catch((error) => {
    console.log("Error creating data", error);
    process.exit(1);
})