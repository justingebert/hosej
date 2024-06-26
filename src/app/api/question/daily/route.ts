import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import user from "@/db/models/user";
import { NextResponse } from 'next/server'

//TODO questions left parameters
export const revalidate = 0

//get active daily questions
async function getDailyQuestion() {
  try {
    await dbConnect();

    let questions = await Question.find({
      category: "Daily",
      used: true,
      active: true,
    });
    if (!questions) {
      return [];
    }

    return questions;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

//populate questions
async function populateAndSaveQuestions(questions:any) {
    const populatedQuestions = await Promise.all(questions.map(async (question:any) => {
        const populatedQuestion = await Question.findById(question._id).populate({
            path: 'answers.username',
            select: 'username -_id'
        });

        if (populatedQuestion.questionType.startsWith("users-")) {
            const users = await user.find({});
            populatedQuestion.options = users.map(user => user.username);
        } else if (populatedQuestion.questionType.startsWith("rating")) {
            populatedQuestion.options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        }
        
        await populatedQuestion.save();

        return populatedQuestion;
    }));

    return populatedQuestions;
}

//return active daily questions
export async function GET(req: Request){
    try{
        await dbConnect();

        const questions = await getDailyQuestion();
        if (!questions) {
            return NextResponse.json({ message: "No questions available" });
        }
        
        const updatedQuestions = await populateAndSaveQuestions(questions);
        
        return NextResponse.json({ questions: updatedQuestions });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ message: error });
    }
}