import Question from "./models/Question";

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
    
    await Question.deleteMany({});
    await Question.insertMany(questions);
}