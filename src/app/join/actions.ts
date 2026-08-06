"use server"
import prisma from "@/lib/prisma";

export async function joinGameSession(pin: string, nickname: string, userId?: string) {
    try {
        // 1. Clean the input
        const cleanPin = pin.trim();
        const cleanName = nickname.trim();

        if (!cleanPin || !cleanName) return { error: "PIN and Nickname are required." };

        // 2. Find the session
        const session = await prisma.gameSession.findUnique({
            where: { joinCode: cleanPin },
            include: { quiz: { select: { title: true } } }
        });

        // 3. Validation Checks
        if (!session) return { error: "We didn't recognize that Game PIN. Please check and try again." };
        if (session.status !== "IN_PROGRESS") return { error: "This game is currently not active." };
        if (session.expiresAt && new Date() > session.expiresAt) return { error: "This assignment has expired." };

        // 4. Create the Participant
        const participant = await prisma.participant.create({
            data: {
                sessionId: session.id,
                nickname: cleanName,
                userId: userId || null, // Links to account if they are logged in!
            }
        });

        // 5. Return success data so the frontend can redirect
        return {
            sessionId: session.id,
            participantId: participant.id,
            quizTitle: session.quiz.title
        };

    } catch (error) {
        console.error("Failed to join session:", error);
        return { error: "An error occurred while joining. Please try again." };
    }
}