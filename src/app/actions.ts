"use server"

import prisma from "@/lib/prisma"
import { QuizData } from "./page";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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
                aiCredits: true,
                quizzes: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        difficulty: true
                    }
                }
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

export async function deleteQuiz(quizId: string, userId: string) {
    if (!quizId) return;

    try {
        const quizToDelete = await prisma.quiz.delete({
            where: {
                id: quizId,
                creatorId: userId
            }
        })



    } catch (error) {
        console.log(error)
        return { error: "Failed to delete quiz." }
    }
    redirect("/");
}

export async function logOutUser() {
    try {
        const supabase = await createClient()

        const { error } = await supabase.auth.signOut();

        if (error) {
            return { error: "Failed to logout user" }
        }

        return { success: true };
    } catch (err) {
        return { error: "Failed to logout user" }
    }

}