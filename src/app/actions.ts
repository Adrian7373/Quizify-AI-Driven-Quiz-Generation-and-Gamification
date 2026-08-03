"use server"

import prisma from "@/lib/prisma"
import { QuizData } from "./page";

export async function getUser(userId: string) {

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                role: true,
                aiCredits: true
            }
        })

        if (!user) {
            return { error: "User not found." }
        }

        return { user };

    } catch (error) {
        return { error: "Failed to get user information." }
    }
}

export async function saveQuiz(quizData: QuizData, userId: string) {

    try {
        const quiz = await prisma.quiz.create({
            data: {
                title: quizData.title,
                description: quizData.description,
                creator: { connect: { id: userId } },
                questions: {
                    create: quizData.questions.map((question) => ({
                        questionText: question.questionText,
                        options: question.options,
                        correctAnswer: question.correctAnswer,
                        explanation: question.explanation,
                    }))
                }
            },
        })

        return { success: true };

    } catch (error) {
        console.error("Failed to save quiz:", error);
        return { error: "Failed to save quiz." };
    }
}