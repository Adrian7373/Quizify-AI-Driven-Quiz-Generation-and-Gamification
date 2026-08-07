"use server"
import prisma from "@/lib/prisma";

export async function startGameSession(sessionId: string) {
    try {
        await prisma.gameSession.update({
            where: { id: sessionId },
            data: { status: "IN_PROGRESS" }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to start game:", error);
        return { error: "Failed to start game." };
    }
}

export async function updateQuestionIndex(sessionId: string, newIndex: number) {
    try {
        await prisma.gameSession.update({
            where: { id: sessionId },
            data: { currentQuestionIndex: newIndex }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to advance question:", error);
        return { error: "Failed to advance to the next question." };
    }
}