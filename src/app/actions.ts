"use server"

import prisma from "@/lib/prisma"
import { QuizData } from "./page";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

//For ending game sessions early
export async function endSessionEarly(sessionId: string, hostId: string) {
    try {
        // 1. Verify ownership
        const session = await prisma.gameSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) return { error: "Session not found." };
        if (session.hostId !== hostId) return { error: "Unauthorized." };

        // 2. Update status to FINISHED
        await prisma.gameSession.update({
            where: { id: sessionId },
            data: { status: "FINISHED" }
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to end session:", error);
        return { error: "An error occurred while ending the session." };
    }
}

//Live session checker
export async function getActiveLiveSession(hostId: string) {
    try {
        const activeSession = await prisma.gameSession.findFirst({
            where: {
                hostId: hostId,
                mode: "LIVE",
                status: {
                    in: ["WAITING", "IN_PROGRESS"]
                }
            },
            select: {
                id: true,
                status: true,
                quiz: { select: { title: true } }
            }
        });

        return { session: activeSession };
    } catch (error) {
        console.error("Failed to check active session:", error);
        return { session: null };
    }
}

//Update quiz data

interface UpdateQuizData {
    title: string;
    description: string;
    questions: {
        questionText: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
        timeLimitSeconds?: number | null;
    }[];
}

export async function updateQuiz(quizId: string, userId: string, data: UpdateQuizData) {
    try {
        // 1. Verify Ownership (Security Check)
        const existingQuiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            select: { creatorId: true }
        });

        if (!existingQuiz) return { error: "Quiz not found." };
        if (existingQuiz.creatorId !== userId) return { error: "Unauthorized. You do not own this quiz." };

        // 2. Perform Atomic Nested Update
        await prisma.quiz.update({
            where: { id: quizId },
            data: {
                title: data.title,
                description: data.description,
                // Replace all existing questions with the newly edited array
                questions: {
                    deleteMany: {},
                    create: data.questions.map((q) => ({
                        questionText: q.questionText,
                        options: q.options || [],
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        timeLimitSeconds: q.timeLimitSeconds || null
                    }))
                }
            }
        });

        // 3. Purge the cache so the NavBar and Dashboard instantly reflect the new Title/Questions
        revalidatePath('/', 'layout');

        return { success: true };

    } catch (error) {
        console.error("Failed to update quiz:", error);
        return { error: "An error occurred while saving your edits." };
    }
}