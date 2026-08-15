"use server"
import prisma from "@/lib/prisma";

export async function joinGameSession(pin: string, nickname: string) {
    try {
        const session = await prisma.gameSession.findFirst({
            where: {
                joinCode: pin,
                OR: [
                    { status: "WAITING" }, // Live games waiting in lobby
                    {
                        status: "IN_PROGRESS",
                        mode: "ASYNC",
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } }
                        ]
                    }
                ]
            },
        });

        if (!session) {
            return { error: "Invalid PIN or the game has already started." };
        }

        // Create the base participant (factionId is null for now)
        const participant = await prisma.participant.create({
            data: {
                nickname: nickname.trim(),
                sessionId: session.id,
            },
        });

        return {
            success: true,
            sessionId: session.id,
            participantId: participant.id,
            mode: session.mode
        };
    } catch (error) {
        console.error("Join Error:", error);
        return { error: "Failed to join the game." };
    }
}

// ==========================================
// 2. CHECK FACTION STATUS (Realtime Triage)
// ==========================================
export async function checkFactionStatus(sessionId: string) {
    try {
        const session = await prisma.gameSession.findUnique({
            where: { id: sessionId },
            select: { maxFactions: true }
        });

        if (!session) throw new Error("Session not found");

        const factions = await prisma.faction.findMany({
            where: { sessionId: sessionId },
            include: {
                _count: {
                    select: { members: true }
                }
            },
            orderBy: {
                name: 'asc' // Keep the hero cards in alphabetical order so they don't jump around
            }
        });

        // Format the data for the frontend
        const formattedFactions = factions.map(f => ({
            id: f.id,
            name: f.name,
            leaderId: f.leaderId,
            memberCount: f._count.members
        }));

        return {
            success: true,
            maxFactions: session.maxFactions,
            factions: formattedFactions
        };
    } catch (error) {
        console.error("Status Check Error:", error);
        return { success: false, maxFactions: 4, factions: [] };
    }
}

// ==========================================
// 3. CREATE FACTION (Leader Only)
// ==========================================
export async function createFaction(sessionId: string, participantId: string, factionName: string) {
    try {
        // Safety Check 1: Ensure the name isn't already taken in this session
        const existingFaction = await prisma.faction.findFirst({
            where: {
                sessionId: sessionId,
                name: factionName
            }
        });

        if (existingFaction) {
            return { error: "That faction name is already taken! Choose another." };
        }

        // Safety Check 2: Ensure we haven't hit the max factions limit due to a race condition
        const session = await prisma.gameSession.findUnique({
            where: { id: sessionId },
            include: { _count: { select: { factions: true } } }
        });

        if (!session || session._count.factions >= session.maxFactions) {
            return { error: "All factions have already been established." };
        }

        // We use a transaction to ensure the faction is created AND the leader is assigned simultaneously
        await prisma.$transaction(async (tx) => {
            const newFaction = await tx.faction.create({
                data: {
                    name: factionName,
                    sessionId: sessionId,
                    leaderId: participantId,
                }
            });

            await tx.participant.update({
                where: { id: participantId },
                data: { factionId: newFaction.id }
            });
        });

        return { success: true };
    } catch (error) {
        console.error("Create Faction Error:", error);
        return { error: "Failed to establish faction." };
    }
}

// ==========================================
// 4. JOIN FACTION (Members)
// ==========================================
export async function joinFaction(participantId: string, factionId: string) {
    try {
        await prisma.participant.update({
            where: { id: participantId },
            data: { factionId: factionId }
        });

        return { success: true };
    } catch (error) {
        console.error("Join Faction Error:", error);
        return { error: "Failed to join faction." };
    }
}